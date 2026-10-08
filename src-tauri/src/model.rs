/* Questions to the AI model, over a connection that stays open.

The http plugin builds a client for every request, and with it a new
connection: measured against the cloud model, about 0.3 s of every
question went into setting one up. One client here keeps them. Two things
come with that and are handled here, not in the window:

- https anywhere; plain http only on this machine or in the reader's own
  network — a model on another computer at home. Nothing else is sent, and
  plain http to anywhere else is refused as unencrypted, not as absent.
- A kept connection can have died while it waited — the Mac slept, the
  network changed, the server or LM Studio closed it. A question that fails
  on the connection itself, before any answer, is asked once more; the
  client then opens a fresh one. A timeout is not asked again. */

use std::sync::OnceLock;
use std::time::Duration;

use tauri_plugin_http::reqwest;

/* Above the window's own deadline (180 s in llm.js), so the window decides. */
const CEILING: Duration = Duration::from_secs(190);
/* A connection nobody used for this long is let go rather than trusted. */
const IDLE: Duration = Duration::from_secs(55);

#[derive(serde::Deserialize)]
pub struct ModelRequest {
    url: String,
    method: String,
    headers: Vec<(String, String)>,
    body: Option<String>,
}

#[derive(serde::Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ModelAnswer {
    status: u16,
    status_text: String,
    retry_after: Option<String>,
    body: String,
}

fn client() -> &'static reqwest::Client {
    static CLIENT: OnceLock<reqwest::Client> = OnceLock::new();
    CLIENT.get_or_init(|| {
        reqwest::Client::builder()
            .pool_idle_timeout(IDLE)
            .tcp_keepalive(Duration::from_secs(30))
            .timeout(CEILING)
            .build()
            .unwrap_or_else(|_| reqwest::Client::new())
    })
}

pub fn allowed(url: &str) -> bool {
    let Ok(parsed) = reqwest::Url::parse(url) else {
        return false;
    };
    match parsed.scheme() {
        "https" => parsed.host_str().is_some_and(|host| !host.is_empty()),
        "http" => parsed.host_str().is_some_and(in_own_network),
        _ => false,
    }
}

/* This machine, or a network the reader's router or VPN hands out: the
private ranges, link-local, the shared range Tailscale uses, and names
only a local network resolves — a computer's own name without a dot, or
one under .local, .lan, .home.arpa or .internal. */
fn in_own_network(host: &str) -> bool {
    use std::net::IpAddr;
    match host
        .trim_start_matches('[')
        .trim_end_matches(']')
        .parse::<IpAddr>()
    {
        Ok(IpAddr::V4(ip)) => {
            let [a, b, ..] = ip.octets();
            ip.is_loopback()
                || ip.is_private()
                || ip.is_link_local()
                || (a == 100 && (64..128).contains(&b))
        }
        Ok(IpAddr::V6(ip)) => {
            let first = ip.segments()[0];
            ip.is_loopback() || (first & 0xfe00) == 0xfc00 || (first & 0xffc0) == 0xfe80
        }
        Err(_) => {
            let name = host.trim_end_matches('.').to_ascii_lowercase();
            !name.is_empty()
                && (!name.contains('.')
                    || [".local", ".lan", ".home.arpa", ".internal", ".localhost"]
                        .iter()
                        .any(|suffix| name.ends_with(suffix)))
        }
    }
}

/* Plain http to an address outside the reader's own network: refused, and
said as what it is, so the reader looks at the address and not the cable. */
fn unencrypted(url: &str) -> bool {
    reqwest::Url::parse(url).is_ok_and(|parsed| parsed.scheme() == "http")
}

/* Failed on the way there rather than in the answer, and not for lack of
time: the connection it went out on was not there any more. */
fn worth_asking_again(error: &reqwest::Error) -> bool {
    !error.is_timeout() && (error.is_connect() || error.is_request())
}

/* The window tells a timeout by the first words (model-fetch.js). */
fn said(error: &reqwest::Error) -> String {
    let mut detail = error.to_string();
    let mut source = std::error::Error::source(error);
    while let Some(inner) = source {
        detail = format!("{detail}: {inner}");
        source = inner.source();
    }
    if error.is_timeout() {
        format!("timed out: {detail}")
    } else {
        format!("unreachable: {detail}")
    }
}

async fn send_once(request: &ModelRequest) -> Result<reqwest::Response, reqwest::Error> {
    let method =
        reqwest::Method::from_bytes(request.method.as_bytes()).unwrap_or(reqwest::Method::GET);
    let mut builder = client().request(method, &request.url);
    for (name, value) in &request.headers {
        builder = builder.header(name, value);
    }
    if let Some(body) = &request.body {
        builder = builder.body(body.clone());
    }
    builder.send().await
}

pub async fn ask(request: ModelRequest) -> Result<ModelAnswer, String> {
    if !allowed(&request.url) {
        if unencrypted(&request.url) {
            return Err(format!(
                "insecure: {} is plain http outside the own network",
                request.url
            ));
        }
        return Err(format!(
            "unreachable: {} is not an address the app may reach",
            request.url
        ));
    }
    let response = match send_once(&request).await {
        Ok(response) => response,
        Err(error) if worth_asking_again(&error) => {
            send_once(&request).await.map_err(|e| said(&e))?
        }
        Err(error) => return Err(said(&error)),
    };
    let status = response.status();
    let retry_after = response
        .headers()
        .get(reqwest::header::RETRY_AFTER)
        .and_then(|value| value.to_str().ok())
        .map(str::to_string);
    let body = response.text().await.map_err(|e| said(&e))?;
    Ok(ModelAnswer {
        status: status.as_u16(),
        status_text: status.canonical_reason().unwrap_or("").to_string(),
        retry_after,
        body,
    })
}

#[tauri::command]
pub async fn model_request(request: ModelRequest) -> Result<ModelAnswer, String> {
    ask(request).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::{Read, Write};
    use std::net::TcpListener;

    #[test]
    fn only_the_addresses_the_plugin_allows() {
        assert!(allowed("https://openrouter.ai/api/v1/chat/completions"));
        assert!(allowed("http://127.0.0.1:1234/v1/models"));
        assert!(allowed("http://localhost:11434/v1/models"));
        assert!(allowed("http://192.168.1.20:1234/v1/models"));
        assert!(allowed("http://10.0.0.5:11434/v1"));
        assert!(allowed("http://172.20.1.1:1234/v1"));
        assert!(allowed("http://100.101.102.103:1234/v1"));
        assert!(allowed("http://[::1]:1234/v1"));
        assert!(allowed("http://[fd12:3456::1]:1234/v1"));
        assert!(allowed("http://gaming-pc:11434/v1"));
        assert!(allowed("http://gaming-pc.local:11434/v1"));
        assert!(!allowed("http://example.com/v1"));
        assert!(!allowed("http://8.8.8.8/v1"));
        assert!(!allowed("http://172.32.0.1/v1"));
        assert!(!allowed("http://100.128.0.1/v1"));
        assert!(!allowed("file:///etc/passwd"));
        assert!(!allowed("not a url"));
    }

    fn post(url: String) -> ModelRequest {
        ModelRequest {
            url,
            method: "POST".into(),
            headers: vec![("Content-Type".into(), "application/json".into())],
            body: Some("{}".into()),
        }
    }

    /* Reads one request off the stream, headers and a Content-Length body. */
    fn read_request(stream: &mut std::net::TcpStream) -> bool {
        let mut seen = Vec::new();
        let mut byte = [0u8; 1];
        while !seen.ends_with(b"\r\n\r\n") {
            match stream.read(&mut byte) {
                Ok(1) => seen.push(byte[0]),
                _ => return false,
            }
        }
        let head = String::from_utf8_lossy(&seen).to_lowercase();
        let length = head
            .lines()
            .find_map(|line| {
                line.strip_prefix("content-length:")
                    .map(|v| v.trim().parse::<usize>().unwrap_or(0))
            })
            .unwrap_or(0);
        let mut body = vec![0u8; length];
        stream.read_exact(&mut body).is_ok()
    }

    fn answer(stream: &mut std::net::TcpStream, text: &str) {
        let reply = format!(
            "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: keep-alive\r\n\r\n{}",
            text.len(),
            text
        );
        stream.write_all(reply.as_bytes()).unwrap();
        stream.flush().unwrap();
    }

    /* The second question goes out on the kept connection, which the server
    then drops without a word — what a connection that died while it
    waited looks like. It is asked again on a new one and answered. */
    #[test]
    fn a_connection_that_died_is_asked_again_on_a_new_one() {
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let port = listener.local_addr().unwrap().port();
        let server = std::thread::spawn(move || {
            let (mut first, _) = listener.accept().unwrap();
            assert!(read_request(&mut first));
            answer(&mut first, "\"one\"");
            assert!(read_request(&mut first));
            drop(first);
            let (mut second, _) = listener.accept().unwrap();
            assert!(read_request(&mut second));
            answer(&mut second, "\"two\"");
        });
        let url = format!("http://127.0.0.1:{port}/v1/chat/completions");
        tauri::async_runtime::block_on(async {
            let one = ask(post(url.clone())).await.unwrap();
            assert_eq!(one.body, "\"one\"");
            let two = ask(post(url.clone())).await.unwrap();
            assert_eq!(two.status, 200);
            assert_eq!(two.body, "\"two\"");
        });
        server.join().unwrap();
    }

    #[test]
    fn plain_http_outside_the_own_network_says_insecure() {
        let result =
            tauri::async_runtime::block_on(ask(post("http://example.com/v1/models".into())));
        assert!(result.unwrap_err().starts_with("insecure:"));
        let result = tauri::async_runtime::block_on(ask(post("ftp://example.com/v1".into())));
        assert!(result.unwrap_err().starts_with("unreachable:"));
    }

    #[test]
    fn a_refused_address_says_unreachable() {
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let port = listener.local_addr().unwrap().port();
        drop(listener);
        let result =
            tauri::async_runtime::block_on(ask(post(format!("http://127.0.0.1:{port}/v1/models"))));
        assert!(result.unwrap_err().starts_with("unreachable:"));
    }

    #[test]
    fn a_status_and_its_retry_after_are_handed_on() {
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let port = listener.local_addr().unwrap().port();
        let server = std::thread::spawn(move || {
            let (mut stream, _) = listener.accept().unwrap();
            assert!(read_request(&mut stream));
            stream
                .write_all(b"HTTP/1.1 429 Too Many Requests\r\nRetry-After: 7\r\nContent-Length: 4\r\n\r\nbusy")
                .unwrap();
        });
        let got = tauri::async_runtime::block_on(ask(post(format!(
            "http://127.0.0.1:{port}/v1/chat/completions"
        ))))
        .unwrap();
        assert_eq!(got.status, 429);
        assert_eq!(got.status_text, "Too Many Requests");
        assert_eq!(got.retry_after.as_deref(), Some("7"));
        assert_eq!(got.body, "busy");
        server.join().unwrap();
    }
}
