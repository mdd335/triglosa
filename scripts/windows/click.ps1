# Clicks at a place on the screen, in physical pixels as shot.ps1 records them;
# with -ToX and -ToY, presses there and drags to that place instead.
param([Parameter(Mandatory)][int]$X, [Parameter(Mandatory)][int]$Y, [switch]$Move, [switch]$Right, [int]$Wheel = 0, [int]$ToX = -1, [int]$ToY = -1)
Add-Type -Namespace Native -Name Mouse -MemberDefinition @'
[DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
[DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
[DllImport("user32.dll")] public static extern void mouse_event(uint f, int x, int y, uint d, System.UIntPtr e);
'@
[void][Native.Mouse]::SetProcessDPIAware()
[void][Native.Mouse]::SetCursorPos($X, $Y)
Start-Sleep -Milliseconds 80
if ($Wheel) { [Native.Mouse]::mouse_event(0x0800, 0, 0, [BitConverter]::ToUInt32([BitConverter]::GetBytes([int]$Wheel), 0), [UIntPtr]::Zero); return }
if ($Move) { return }
if ($ToX -ge 0 -and $ToY -ge 0) {
  [Native.Mouse]::mouse_event(2, 0, 0, 0, [UIntPtr]::Zero)
  for ($i = 1; $i -le 20; $i++) {
    [void][Native.Mouse]::SetCursorPos($X + ($ToX - $X) * $i / 20, $Y + ($ToY - $Y) * $i / 20)
    Start-Sleep -Milliseconds 25
  }
  [Native.Mouse]::mouse_event(4, 0, 0, 0, [UIntPtr]::Zero)
  return
}
$down, $up = if ($Right) { 8, 16 } else { 2, 4 }
[Native.Mouse]::mouse_event($down, 0, 0, 0, [UIntPtr]::Zero)
Start-Sleep -Milliseconds 40
[Native.Mouse]::mouse_event($up, 0, 0, 0, [UIntPtr]::Zero)
