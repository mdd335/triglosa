# Presses a key combination the way a keyboard would, e.g. "Win+Shift+E".
param([Parameter(Mandatory)][string]$Combination)
Add-Type -Namespace Native -Name Keys -MemberDefinition '[DllImport("user32.dll")] public static extern void keybd_event(byte vk, byte scan, uint flags, System.UIntPtr extra); [DllImport("user32.dll")] public static extern uint MapVirtualKey(uint code, uint type);'
$codes = @{ Win = 0x5B; Ctrl = 0x11; Alt = 0x12; Shift = 0x10; Esc = 0x1B; Enter = 0x0D; Tab = 0x09; Space = 0x20; Comma = 0xBC; Quote = 0xDE }
$keys = $Combination.Split("+") | ForEach-Object {
  if ($codes.ContainsKey($_)) { $codes[$_] } else { [byte][char]$_.ToUpper() }
}
# With its scan code, as a keyboard sends it: a page reads the key's place from it.
$extended = @(0x5B)
function Press($k, $up) {
  $scan = [byte][Native.Keys]::MapVirtualKey([uint32]$k, 0)
  $flags = 0
  if ($up) { $flags = $flags -bor 2 }
  if ($extended -contains $k) { $flags = $flags -bor 1 }
  [Native.Keys]::keybd_event([byte]$k, $scan, $flags, [UIntPtr]::Zero)
  Start-Sleep -Milliseconds 30
}
foreach ($k in $keys) { Press $k $false }
[array]::Reverse($keys)
foreach ($k in $keys) { Press $k $true }
