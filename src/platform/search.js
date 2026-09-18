/* Looking a word up on the web.

   Which search engine opens is the user's own system setting, not ours: a
   link that ignores it is a small betrayal of the browser they chose. */

export const SEARCH_URLS = {
  duckduckgo: "https://duckduckgo.com/?q=",
  google: "https://www.google.com/search?q=",
  bing: "https://www.bing.com/search?q=",
  yahoo: "https://search.yahoo.com/search?p=",
  ecosia: "https://www.ecosia.org/search?q=",
  startpage: "https://www.startpage.com/sp/search?query=",
  qwant: "https://www.qwant.com/?q=",
  brave: "https://search.brave.com/search?q=",
  perplexity: "https://www.perplexity.ai/search?q=",
};

/* What the settings offer, named as each service names itself. */
export const SEARCH_NAMES = {
  google: "Google",
  bing: "Bing",
  duckduckgo: "DuckDuckGo",
  ecosia: "Ecosia",
  startpage: "Startpage",
  qwant: "Qwant",
  brave: "Brave Search",
  yahoo: "Yahoo",
  perplexity: "Perplexity",
};

/* The setting's choice: one of the services above, or "system" for the one
   the Mac is set to. Windows has no such setting — every browser keeps its
   own — so "system" there is DuckDuckGo. */
export const SYSTEM_SEARCH = "system";
export const WINDOWS_SEARCH = "duckduckgo";

/* The default when nothing else is known. Getting nothing back means "no
   deviating setting", and the system default is Google — so unlike the
   translation probe, this answer is remembered: the fallback is correct, not
   merely a failure. */
export const DEFAULT_SEARCH = SEARCH_URLS.google;

/* The system reports its provider as an identifier. It is sometimes
   com.google and sometimes com.google.www, so this tests for containment
   rather than equality. */
export function searchUrlFor(providerReport) {
  const found = String(providerReport || "").match(/NSProviderIdentifier\s*=\s*"?([\w.]+)"?/);
  if (found) {
    const identifier = found[1].toLowerCase();
    for (const name of Object.keys(SEARCH_URLS)) {
      if (identifier.includes(name)) return SEARCH_URLS[name];
    }
  }
  return DEFAULT_SEARCH;
}

export function searchLink(baseUrl, term) {
  return baseUrl + encodeURIComponent(term);
}
