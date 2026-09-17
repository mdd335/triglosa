#!/bin/sh
# Copies the working tree into the VM, builds the x64 app there with its
# page built in, and starts it in the desktop session. What is built is the
# debug build: the same code, minutes faster, with a console for its output.
set -e
cd "$(dirname "$0")"
./sync.sh
./run.sh 'Get-Process Triglosa -ErrorAction SilentlyContinue | Stop-Process -Force; Start-Sleep 1; cmd /c "npx tauri build --debug --target x86_64-pc-windows-msvc --no-bundle 2>&1" | Select-String -Pattern "^error|^\s+-->|Built application|could not compile" -Context 0,6 | % { $_.ToString() }'
printf '%s\n' \
  'Get-Process Triglosa -ErrorAction SilentlyContinue | Stop-Process -Force' \
  'explorer.exe C:\triglosa\src-tauri\target\x86_64-pc-windows-msvc\debug\Triglosa.exe' \
  'Start-Sleep 5' \
  '"started"' | ./desk.sh
