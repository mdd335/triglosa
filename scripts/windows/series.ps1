# A test series of the word and the sentence under the pointer, run in the
# desktop session (series.sh starts it): Edge, Chrome or Firefox opens the test page with
# its debugging port, says where each word stands (words.js from scripts/mac-vm),
# and each word is pointed at and its shortcut pressed — Ctrl+Alt+W for the
# word, Ctrl+Alt+J for the sentence, as the VM's settings hold them. What
# Triglosa took is read from its trace. One line a try.
param([string]$Modes = "ws", [string]$Only = ".", [string]$Page = "", [string]$Browser = "Edge", [switch]$Fresh)
$ErrorActionPreference = "Stop"
$dir = "C:\triglosa-tools\capture"
$trace = "C:\triglosa-tools\trace.log"
Add-Type -Namespace Native -Name Input -MemberDefinition @'
[DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
[DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
[DllImport("user32.dll")] public static extern void keybd_event(byte vk, byte scan, uint flags, System.UIntPtr extra);
[DllImport("user32.dll")] public static extern uint MapVirtualKey(uint code, uint type);
'@
[void][Native.Input]::SetProcessDPIAware()
function Press([byte[]]$keys) {
  foreach ($k in $keys) { [Native.Input]::keybd_event($k, [byte][Native.Input]::MapVirtualKey($k, 0), 0, [UIntPtr]::Zero); Start-Sleep -Milliseconds 30 }
  [array]::Reverse($keys)
  foreach ($k in $keys) { [Native.Input]::keybd_event($k, [byte][Native.Input]::MapVirtualKey($k, 0), 2, [UIntPtr]::Zero); Start-Sleep -Milliseconds 30 }
}

# Not a child of this script: its scheduled task would run for as long as the browser does.
function Start-Detached([string]$line) { [void](Invoke-CimMethod Win32_Process -MethodName Create -Arguments @{ CommandLine = $line }) }

if (-not $Page) { $Page = "file:///C:/triglosa-tools/capture/page.html" }
$program = if ($Browser -eq "Chrome") { "C:\Program Files\Google\Chrome\Application\chrome.exe" } elseif ($Browser -eq "Firefox") { "C:\Program Files\Mozilla Firefox\firefox.exe" } else { "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" }
$dataDir = "C:\triglosa-tools\" + $Browser.ToLower()
# The port is one: a browser left open by the last series would answer in this one's place.
$others = @{ Edge = "chrome", "firefox"; Chrome = "msedge", "firefox"; Firefox = "msedge", "chrome" }[$Browser]
Get-Process $others -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep 1
if ($Browser -eq "Firefox") {
  # All of them: Firefox comes back by itself at login, in a window of its own over the test page.
  Get-Process firefox -ErrorAction SilentlyContinue | Stop-Process -Force
  Start-Sleep 1
  Remove-Item $dataDir -Recurse -Force -ErrorAction SilentlyContinue
  New-Item -ItemType Directory -Force $dataDir | Out-Null
  # No welcome page, no notices over the test page.
  Copy-Item "$dir\firefox-user.js" "$dataDir\user.js"
  Start-Detached "`"$program`" -profile `"$dataDir`" -no-remote --remote-debugging-port 9222 -width 1100 -height 940 `"$Page`""
  for ($i = 0; $i -lt 40; $i++) { Start-Sleep -Milliseconds 500; if ((Test-NetConnection 127.0.0.1 -Port 9222 -WarningAction SilentlyContinue).TcpTestSucceeded) { break } }
  Start-Sleep 3
  $address = "ws://127.0.0.1:9222/session"
} else {
  $running = $null
  try { $running = Invoke-RestMethod http://127.0.0.1:9222/json -TimeoutSec 2 } catch {}
  if ($Fresh -or -not $running) {
    Get-CimInstance Win32_Process -Filter "name='msedge.exe' or name='chrome.exe'" | Where-Object { $_.CommandLine -like "*triglosa-tools\*" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    Start-Sleep 1
    # Killed like this it would offer to restore its pages, over the test page.
    Remove-Item $dataDir -Recurse -Force -ErrorAction SilentlyContinue
    $running = $null
    Start-Detached "`"$program`" --remote-debugging-port=9222 --user-data-dir=`"$dataDir`" --no-first-run --no-default-browser-check --hide-crash-restore-bubble --disable-features=PrivacySandboxSettings4 --window-position=0,0 --window-size=1100,940 `"$Page`""
    for ($i = 0; $i -lt 40 -and -not $running; $i++) { Start-Sleep -Milliseconds 500; try { $running = Invoke-RestMethod http://127.0.0.1:9222/json -TimeoutSec 2 } catch {} }
    Start-Sleep 3
  }
  $address = @($running | Where-Object { $_.type -eq "page" })[0].webSocketDebuggerUrl
}
$socket = New-Object System.Net.WebSockets.ClientWebSocket
if (-not $socket.ConnectAsync([Uri]$address, [Threading.CancellationToken]::None).Wait(10000)) { "$Browser did not answer"; return }
$script:id = 0
function Ask([string]$method, $params) {
  $script:id++
  $json = @{ id = $script:id; method = $method; params = $params } | ConvertTo-Json -Depth 5 -Compress
  $bytes = [Text.Encoding]::UTF8.GetBytes($json)
  $socket.SendAsync([ArraySegment[byte]]$bytes, "Text", $true, [Threading.CancellationToken]::None).Wait()
  while ($true) {
    $all = New-Object System.IO.MemoryStream
    do {
      $buffer = New-Object byte[] 65536
      $receiving = $socket.ReceiveAsync([ArraySegment[byte]]$buffer, [Threading.CancellationToken]::None)
      if (-not $receiving.Wait(15000)) { throw "$Browser gave no answer to $method" }
      $got = $receiving.Result
      $all.Write($buffer, 0, $got.Count)
    } while (-not $got.EndOfMessage)
    $answer = [Text.Encoding]::UTF8.GetString($all.ToArray()) | ConvertFrom-Json
    if ($answer.id -eq $script:id) { return $answer.result }
  }
}
$context = $null
if ($Browser -eq "Firefox") {
  [void](Ask "session.new" @{ capabilities = @{} })
  $context = @((Ask "browsingContext.getTree" @{}).contexts)[0].context
} elseif ($Page -notlike "file:*" -or $Fresh) { [void](Ask "Page.navigate" @{ url = $Page }); Start-Sleep 4 }
function Evaluate([string]$code) {
  if ($context) { return (Ask "script.evaluate" @{ expression = $code; target = @{ context = $context }; awaitPromise = $false }).result.value }
  return (Ask "Runtime.evaluate" @{ expression = $code; returnByValue = $true }).result.value
}
$code = [IO.File]::ReadAllText("$dir\words.js")
$scale = Evaluate "devicePixelRatio"
$words = (Evaluate $code) -split "`n"
if ($Page -notlike "file:*") { $words = $words | Where-Object { $y = [double]($_ -split "`t")[2]; $y -gt 150 -and $y -lt 900 } | Select-Object -First 40 }
$socket.Dispose()
if (-not (Test-Path $trace)) { New-Item $trace -ItemType File | Out-Null }
$pass = 0; $all = 0; $seen = @{}
foreach ($line in $words) {
  $word, $x, $y, $sentence = $line -split "`t"
  if ($word -notmatch $Only) { continue }
  foreach ($mode in $Modes.ToCharArray()) {
    # A sentence once, from its first word.
    if ($mode -eq "s" -and $seen.ContainsKey($sentence) -and $Only -eq ".") { continue }
    if ($mode -eq "s") { $seen[$sentence] = $true }
    if ($mode -eq "w") { $keys = [byte[]](0x11, 0x12, 0x57); $want = $word } else { $keys = [byte[]](0x11, 0x12, 0x4A); $want = $sentence }
    $before = @(Get-Content $trace -Encoding UTF8).Count
    [void][Native.Input]::SetCursorPos([int]([double]$x * $scale), [int]([double]$y * $scale))
    Start-Sleep -Milliseconds 400
    Press $keys
    $new = $null
    for ($t = 0; $t -lt 80; $t++) {
      $lines = @(Get-Content $trace -Encoding UTF8)
      if ($lines.Count -gt $before) { $new = $lines[-1]; break }
      Start-Sleep -Milliseconds 100
    }
    $all++
    $got = if ($new) { $new -replace "^trace: ", "" | ConvertFrom-Json } else { $null }
    $text = if ($got) { $got.text } else { "" }
    if ($text -eq $want) { $mark = "ok"; $pass++ } else { $mark = "XX" }
    $shown = if ($text) { $text } elseif ($new) { $new -replace "^trace: ", "" } else { "(nothing)" }
    $by = if ($got -and $got.by) { $got.by } else { "-" }
    "{0} {1} {2,-12} {3,-8} {4}" -f $mark, $mode, $word, $by, $shown
    # Put the window away for the next one, as a click elsewhere would.
    Press ([byte[]](0x1B))
    Start-Sleep -Milliseconds 300
  }
}
"$pass of $all as expected ($Browser)"
