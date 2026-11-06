# The short tour in the desktop session (tour.sh starts it): each way a text
# comes in or goes out, tried once for real in Notepad, Edge's PDF view, over a
# full-screen Edge and into Anki. One line a try, what Triglosa took read from
# its trace, what it wrote from the program it wrote to.
$dir = "C:\triglosa-tools\capture"
$trace = "C:\triglosa-tools\trace.log"
$answer = "Inserted by the tour"
$word = "sentence"
$line = "A tour sentence in a plain text editor."
Add-Type -AssemblyName UIAutomationClient, UIAutomationTypes
Add-Type -Namespace Native -Name Tour -MemberDefinition @'
[DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
[DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
[DllImport("user32.dll")] public static extern void keybd_event(byte vk, byte scan, uint flags, System.UIntPtr extra);
[DllImport("user32.dll")] public static extern uint MapVirtualKey(uint code, uint type);
[DllImport("user32.dll")] public static extern void mouse_event(uint flags, int x, int y, uint data, System.UIntPtr extra);
[DllImport("user32.dll")] public static extern System.IntPtr WindowFromPoint(POINT p);
[DllImport("user32.dll")] public static extern System.IntPtr GetAncestor(System.IntPtr w, uint how);
[DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(System.IntPtr w, out uint id);
[DllImport("user32.dll")] public static extern bool SetForegroundWindow(System.IntPtr w);
[StructLayout(LayoutKind.Sequential)] public struct POINT { public int X; public int Y; public POINT(int x, int y) { X = x; Y = y; } }
'@
[void][Native.Tour]::SetProcessDPIAware()
$ua = [Windows.Automation.AutomationElement]
$tree = [Windows.Automation.TreeScope]

function Press([byte[]]$keys) {
  foreach ($k in $keys) { [Native.Tour]::keybd_event($k, [byte][Native.Tour]::MapVirtualKey($k, 0), 0, [UIntPtr]::Zero); Start-Sleep -Milliseconds 30 }
  [array]::Reverse($keys)
  foreach ($k in $keys) { [Native.Tour]::keybd_event($k, [byte][Native.Tour]::MapVirtualKey($k, 0), 2, [UIntPtr]::Zero); Start-Sleep -Milliseconds 30 }
}
function Traced { @(Get-Content $trace -Encoding UTF8 -ErrorAction SilentlyContinue).Count }
# The next line the trace takes after $before, as an object, or nothing.
function Taken($before, $tenths = 80) {
  for ($t = 0; $t -lt $tenths; $t++) {
    $lines = @(Get-Content $trace -Encoding UTF8 -ErrorAction SilentlyContinue)
    if ($lines.Count -gt $before) { return ($lines[-1] -replace "^trace: ", "" | ConvertFrom-Json) }
    Start-Sleep -Milliseconds 100
  }
}
function Report($name, $good, $seen) { "{0} {1,-14} {2}" -f $(if ($good) { "ok" } else { "XX" }), $name, $seen; if ($good) { $script:pass++ }; $script:all++ }
function WindowOf([int]$id) {
  # The widest: the process has small helper windows too.
  $ua::RootElement.FindAll($tree::Children, (New-Object Windows.Automation.PropertyCondition($ua::ProcessIdProperty, $id))) |
    Sort-Object { $_.Current.BoundingRectangle.Width } -Descending | Select-Object -First 1
}
function ByName($root, [string]$name) {
  $root.FindFirst($tree::Descendants, (New-Object Windows.Automation.PropertyCondition($ua::NameProperty, $name)))
}
function Middle($rect) { @([int]($rect.X + $rect.Width / 2), [int]($rect.Y + $rect.Height / 2)) }
function Triglosa { (Get-Process Triglosa | Sort-Object StartTime)[0].Id }
function Away { Press ([byte[]](0x1B)); Start-Sleep -Milliseconds 400 }

$pass = 0; $all = 0
if (-not (Test-Path $trace)) { New-Item $trace -ItemType File | Out-Null }

# Firefox comes back by itself at login, over everything.
Get-Process firefox, chrome, msedge -ErrorAction SilentlyContinue | Stop-Process -Force

# A plain text editor: the word under the pointer, the selection by shortcut,
# and what Insert writes back.
function CloseNotepad {
  Get-Process Notepad -ErrorAction SilentlyContinue | Stop-Process -Force
  Start-Sleep 1
  # Or it comes back with what it held, and asks about it.
  Remove-Item "$env:LOCALAPPDATA\Packages\Microsoft.WindowsNotepad_8wekyb3d8bbwe\LocalState\TabState\*" -Force -ErrorAction SilentlyContinue
}
CloseNotepad
Set-Content "$dir\tour.txt" $line -Encoding UTF8
Start-Process notepad.exe -ArgumentList "$dir\tour.txt"
Start-Sleep 3
$pad = Get-Process Notepad | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
[void][Native.Tour]::SetForegroundWindow($pad.MainWindowHandle)
Start-Sleep 1
$root = $ua::FromHandle($pad.MainWindowHandle)
$document = $root.FindFirst($tree::Descendants, (New-Object Windows.Automation.PropertyCondition($ua::IsTextPatternAvailableProperty, $true)))
$pattern = $document.GetCurrentPattern([Windows.Automation.TextPattern]::Pattern)
$found = $pattern.DocumentRange.FindText($word, $false, $false)
$box = $found.GetBoundingRectangles()[0]
$x, $y = Middle $box
[void][Native.Tour]::SetCursorPos($x, $y)
Start-Sleep -Milliseconds 400
$before = Traced
Press ([byte[]](0x11, 0x12, 0x57))
$got = Taken $before
Report "editor word" ($got.text -eq $word) "$($got.by) $($got.text)"
Away

[void][Native.Tour]::SetForegroundWindow($pad.MainWindowHandle)
Start-Sleep -Milliseconds 500
$pattern.DocumentRange.FindText($line, $false, $false).Select()
Start-Sleep -Milliseconds 300
$before = Traced
Press ([byte[]](0x11, 0xDE))
$got = Taken $before
Report "selection" ($got.text -eq $line) "$($got.by) $($got.text)"
Start-Sleep 3
$app = WindowOf (Triglosa)
$rect = $app.Current.BoundingRectangle
[void][Native.Tour]::SetCursorPos([int]($rect.X + $rect.Width / 2), [int]($rect.Y + 110))
Start-Sleep -Milliseconds 800
$insert = ByName $app "Einf$([char]0xFC)gen"
if ($insert) {
  $x, $y = Middle $insert.Current.BoundingRectangle
  [void][Native.Tour]::SetCursorPos($x, $y)
  Start-Sleep -Milliseconds 300
  [Native.Tour]::mouse_event(2, 0, 0, 0, [UIntPtr]::Zero)
  [Native.Tour]::mouse_event(4, 0, 0, 0, [UIntPtr]::Zero)
  Start-Sleep 3
  $written = $pattern.DocumentRange.GetText(-1)
  Report "insert" ($written -like "*$answer*") $written.Trim()
} else { Report "insert" $false "no Insert button" }

# Text from a screenshot: the shortcut, then a frame drawn over Notepad's line.
[void][Native.Tour]::SetForegroundWindow($pad.MainWindowHandle)
Start-Sleep -Milliseconds 500
$whole = $pattern.DocumentRange.GetBoundingRectangles()[0]
$before = Traced
Press ([byte[]](0x11, 0x12, 0x53))
Start-Sleep 2
[void][Native.Tour]::SetCursorPos([int]$whole.X - 6, [int]$whole.Y - 6)
Start-Sleep -Milliseconds 200
[Native.Tour]::mouse_event(2, 0, 0, 0, [UIntPtr]::Zero)
for ($i = 1; $i -le 10; $i++) { [void][Native.Tour]::SetCursorPos([int]($whole.X - 6 + ($whole.Width + 40) * $i / 10), [int]($whole.Y - 6 + ($whole.Height + 12) * $i / 10)); Start-Sleep -Milliseconds 20 }
[Native.Tour]::mouse_event(4, 0, 0, 0, [UIntPtr]::Zero)
$got = Taken $before 120
$text = "$($got.text)"
Report "screenshot" ($got.route -eq "screen" -and $text -like "*tour*") "$($got.by) $text"
Away
CloseNotepad

# A PDF in Edge's own view, then Edge in full screen under the reading window.
Get-Process msedge -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep 1
Remove-Item C:\triglosa-tools\edge -Recurse -Force -ErrorAction SilentlyContinue
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
[void](Invoke-CimMethod Win32_Process -MethodName Create -Arguments @{ CommandLine = "`"$edge`" --user-data-dir=C:\triglosa-tools\edge --no-first-run --no-default-browser-check --window-position=0,0 --window-size=1100,940 file:///C:/triglosa-tools/capture/tour.pdf" })
Start-Sleep 7
$view = Get-Process msedge | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
$root = $ua::FromHandle($view.MainWindowHandle)
# The view gives its text to no search: the first line stands where tour.pdf and this window's size put it.
$rect = $root.Current.BoundingRectangle
[void][Native.Tour]::SetCursorPos([int]($rect.X + $rect.Width * 0.45), [int]($rect.Y + $rect.Height * 0.255))
Start-Sleep -Milliseconds 500
$before = Traced
Press ([byte[]](0x11, 0x12, 0x4A))
$got = Taken $before
Report "pdf" ($got.text -eq "The tour reads a word in a document.") "$($got.by) $($got.text)"
Away

Get-Process msedge -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep 1
Remove-Item C:\triglosa-tools\edge -Recurse -Force -ErrorAction SilentlyContinue
[void](Invoke-CimMethod Win32_Process -MethodName Create -Arguments @{ CommandLine = "`"$edge`" --user-data-dir=C:\triglosa-tools\edge --no-first-run --no-default-browser-check --start-fullscreen file:///C:/triglosa-tools/capture/page.html" })
Start-Sleep 7
[void][Native.Tour]::SetCursorPos(320, 162)
Start-Sleep -Milliseconds 500
$before = Traced
Press ([byte[]](0x11, 0x12, 0x57))
$got = Taken $before
Start-Sleep 1
$app = WindowOf (Triglosa)
$x, $y = Middle $app.Current.BoundingRectangle
$top = [Native.Tour]::GetAncestor([Native.Tour]::WindowFromPoint((New-Object Native.Tour+POINT($x, $y))), 2)
$owner = 0; [void][Native.Tour]::GetWindowThreadProcessId($top, [ref]$owner)
$over = (Get-Process -Id $owner).ProcessName
Report "over full" ($over -eq "Triglosa" -and $got.text) "$over in front at $x,$y, took $($got.text) $($got.failed)"
Away
Get-Process msedge -ErrorAction SilentlyContinue | Stop-Process -Force

# A card into Anki, from the selection, the note looked for through AnkiConnect
# and taken out again.
Get-Process anki -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep 1
[void](Invoke-CimMethod Win32_Process -MethodName Create -Arguments @{ CommandLine = "$env:LOCALAPPDATA\Programs\Anki\anki.exe" })
function Anki($action, $params = @{}) {
  $body = @{ action = $action; version = 6; params = $params } | ConvertTo-Json -Depth 5 -Compress
  (Invoke-RestMethod http://127.0.0.1:8765 -Method Post -Body $body -TimeoutSec 5)
}
for ($i = 0; $i -lt 30; $i++) { Start-Sleep 1; try { [void](Anki "version"); break } catch {} }
$query = "tour-$(Get-Date -Format HHmmss)"
Set-Content "$dir\tour.txt" $query -Encoding UTF8
Start-Process notepad.exe -ArgumentList "$dir\tour.txt"
Start-Sleep 3
$pad = Get-Process Notepad | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
[void][Native.Tour]::SetForegroundWindow($pad.MainWindowHandle)
Start-Sleep 1
$root = $ua::FromHandle($pad.MainWindowHandle)
$document = $root.FindFirst($tree::Descendants, (New-Object Windows.Automation.PropertyCondition($ua::IsTextPatternAvailableProperty, $true)))
$document.GetCurrentPattern([Windows.Automation.TextPattern]::Pattern).DocumentRange.Select()
Start-Sleep -Milliseconds 300
Press ([byte[]](0x11, 0x10, 0xDE))
Start-Sleep 4
$send = $null
$card = $null
foreach ($id in (Get-Process Triglosa).Id) {
  foreach ($top in $ua::RootElement.FindAll($tree::Children, (New-Object Windows.Automation.PropertyCondition($ua::ProcessIdProperty, $id)))) {
    $send = ByName $top "In Anki speichern"
    if ($send) { $card = $top; break }
  }
  if ($send) { break }
}
if ($send) {
  # Anki waits for the word and its meaning both: the meaning is typed into
  # the card's second field, as a reader would.
  $edits = $card.FindAll($tree::Descendants, (New-Object Windows.Automation.PropertyCondition($ua::ControlTypeProperty, [Windows.Automation.ControlType]::Edit)))
  if ($edits.Count -ge 2) {
    $edits[1].SetFocus()
    Start-Sleep -Milliseconds 300
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.SendKeys]::SendWait("tour meaning")
    Start-Sleep -Milliseconds 500
  }
  # Greyed until the card's language is found.
  for ($i = 0; $i -lt 50 -and -not $send.Current.IsEnabled; $i++) { Start-Sleep -Milliseconds 200 }
  $send.GetCurrentPattern([Windows.Automation.InvokePattern]::Pattern).Invoke()
  Start-Sleep 3
  $notes = @((Anki "findNotes" @{ query = "`"$query`"" }).result)
  Report "anki" ($notes.Count -eq 1) "$($notes.Count) note found for $query"
  if ($notes.Count) { [void](Anki "deleteNotes" @{ notes = $notes }) }
} else { Report "anki" $false "no button to send the card" }
try { [void](Anki "guiExitAnki") } catch {}
CloseNotepad

"$pass of $all as expected (tour, Windows)"
