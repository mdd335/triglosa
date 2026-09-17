# Runs a PowerShell command inside the logged-in desktop session, where
# windows are visible, and prints what it wrote. An SSH session has no desktop.
param([Parameter(Mandatory)][string]$Command, [int]$Timeout = 120)
$dir = "C:\triglosa-tools"
$id = [guid]::NewGuid().ToString("N").Substring(0, 8)
$job = "$dir\job-$id.ps1"; $log = "$dir\job-$id.log"
Set-Content $job -Encoding UTF8 -Value "& { $Command } *> '$log'"
$action = New-ScheduledTaskAction -Execute "conhost.exe" -Argument "--headless powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$job`""
$principal = New-ScheduledTaskPrincipal -UserId (whoami) -LogonType Interactive -RunLevel Limited
# Windows starts no scheduled task on battery by default, and a VM on a
# laptop is on battery whenever the laptop is.
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName "triglosa-$id" -Action $action -Principal $principal -Settings $settings -Force | Out-Null
Start-ScheduledTask -TaskName "triglosa-$id"
$deadline = (Get-Date).AddSeconds($Timeout)
Start-Sleep -Milliseconds 300
while ((Get-ScheduledTask -TaskName "triglosa-$id").State -eq "Running" -and (Get-Date) -lt $deadline) { Start-Sleep -Milliseconds 200 }
Unregister-ScheduledTask -TaskName "triglosa-$id" -Confirm:$false
if (Test-Path $log) { Get-Content $log; Remove-Item $log }
Remove-Item $job
