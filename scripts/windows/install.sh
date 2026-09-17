#!/bin/sh
# Builds the release installer in the VM and installs it the way a reader
# would, over whatever version is there, then starts the installed app. This
# is the version to try things in; the debug build from app.sh is for testing.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
"$HERE/sync.sh"
"$HERE/run.sh" 'Get-Process Triglosa -ErrorAction SilentlyContinue | Stop-Process -Force; cmd /c "npx tauri build --target x86_64-pc-windows-msvc --bundles nsis 2>&1" | Select-String -Pattern "^error|could not compile|Finished 1 bundle" -Context 0,2 | % { $_.ToString() }'
printf '%s\n' \
  'Get-Process Triglosa -ErrorAction SilentlyContinue | Stop-Process -Force' \
  '$setup = Get-ChildItem C:\triglosa\src-tauri\target\x86_64-pc-windows-msvc\release\bundle\nsis\*-setup.exe | Sort LastWriteTime | Select -Last 1' \
  'Start-Process $setup.FullName -ArgumentList "/S" -Wait' \
  '$exe = Join-Path $env:LOCALAPPDATA "Triglosa\Triglosa.exe"' \
  'explorer.exe $exe' \
  'Start-Sleep 4' \
  '"installed: " + (Get-Item $exe).LastWriteTime' | TIMEOUT=120 "$HERE/desk.sh"
