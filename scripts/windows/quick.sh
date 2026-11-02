#!/bin/sh
# Builds the release app in the VM without its installer and puts it over
# the installed one, then starts it — minutes sooner than install.sh, for
# trying a change. The page is built into the program, so only the program
# is copied; a change to what the installer lays beside it (the models, the
# OCR's files) needs install.sh, and so does a release.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
"$HERE/sync.sh"
"$HERE/run.sh" 'Get-Process Triglosa -ErrorAction SilentlyContinue | Stop-Process -Force; node scripts/aligner-fetch.mjs; cmd /c "npx tauri build --target x86_64-pc-windows-msvc --no-bundle 2>&1" | Select-String -Pattern "^error|could not compile|Built application" -Context 0,2 | % { $_.ToString() }'
printf '%s\n' \
  '$ErrorActionPreference = "Continue"' \
  'Get-Process Triglosa -ErrorAction SilentlyContinue | Stop-Process -Force' \
  'Start-Sleep 2' \
  '$exe = Join-Path $env:LOCALAPPDATA "Triglosa\Triglosa.exe"' \
  'Copy-Item C:\triglosa\src-tauri\target\x86_64-pc-windows-msvc\release\Triglosa.exe $exe -Force' \
  'explorer.exe $exe' \
  'Start-Sleep 4' \
  '"put in place: " + (Get-Item $exe).LastWriteTime' | TIMEOUT=120 "$HERE/desk.sh"
