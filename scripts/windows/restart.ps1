# Starts the installed Triglosa again with its trace on (TRIGLOSA_TRACE, a
# user variable, so the desktop passes it on) and its window at the right
# edge, beside the Edge window series.ps1 opens. Called by series.sh.
$ErrorActionPreference = "Continue"
Get-Process Triglosa -ErrorAction SilentlyContinue | Stop-Process -Force
[Environment]::SetEnvironmentVariable("TRIGLOSA_TRACE", "C:\triglosa-tools\trace.log", "User")
Set-Content "$env:APPDATA\de.mdd335.triglosa\window.json" '{"width":400.0,"height":255.0,"x":1110.0,"y":30.0}'
Start-Sleep 2
explorer.exe (Join-Path $env:LOCALAPPDATA "Triglosa\Triglosa.exe")
Start-Sleep 6
"restarted: " + [Environment]::GetEnvironmentVariable("TRIGLOSA_TRACE","User")
