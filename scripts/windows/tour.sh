#!/bin/sh
# The short tour in the Windows VM (tour.ps1 does the trying). Starts Triglosa
# with its trace on and a stand-in for the AI model (scripts/tour-model.mjs,
# through a tunnel) in place of the settings' own, which come back afterwards.
HERE=$(cd "$(dirname "$0")" && pwd)
. "$HERE/host.sh"
KEY="$HOME/.ssh/triglosa_vm"
O="-i $KEY -o BatchMode=yes -o LogLevel=ERROR"
node "$HERE/../tour-model.mjs" &
model=$!
ssh $O -N -R 1240:127.0.0.1:1240 "$HOST" &
tunnel=$!
trap 'kill $model $tunnel 2>/dev/null' EXIT
ssh $O "$HOST" 'New-Item -ItemType Directory -Force C:\triglosa-tools\capture | Out-Null'
scp -q $O "$HERE/tour.ps1" "$HERE/restart.ps1" "$HERE/../mac-vm/tour.pdf" "$HERE/../mac-vm/page.html" "$HOST:C:/triglosa-tools/capture/"
printf '%s\n' '$ErrorActionPreference = "Continue"' \
  '$file = "$env:APPDATA\de.mdd335.triglosa\settings.json"' \
  'Copy-Item $file "$file.tour" -Force' \
  '$s = Get-Content $file -Raw -Encoding UTF8 | ConvertFrom-Json' \
  '$s.endpoint = "http://127.0.0.1:1240/v1"; $s.model = "tour"; $s.way = "own"; $s.cards.improve = $false' \
  '[IO.File]::WriteAllText($file, ($s | ConvertTo-Json -Depth 12))' \
  '& C:\triglosa-tools\capture\restart.ps1' | "$HERE/desk.sh" >/dev/null
printf '%s\n' '$ErrorActionPreference = "Continue"' '& C:\triglosa-tools\capture\tour.ps1' | TIMEOUT=240 "$HERE/desk.sh"
printf '%s\n' '$ErrorActionPreference = "Continue"' \
  '$file = "$env:APPDATA\de.mdd335.triglosa\settings.json"' \
  'Move-Item "$file.tour" $file -Force' \
  '& C:\triglosa-tools\capture\restart.ps1' | "$HERE/desk.sh" >/dev/null
