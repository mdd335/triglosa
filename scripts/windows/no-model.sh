#!/bin/sh
# Takes the VM's AI model away for a series, or gives it back: the series reads
# what the window took, and every try would otherwise be a paid reading.
#   no-model.sh off   the settings kept aside, an address nobody answers on
#   no-model.sh on    the settings as they were
HERE=$(cd "$(dirname "$0")" && pwd)
case "$1" in
  off) "$HERE/run.sh" '$f = "$env:APPDATA\de.mdd335.triglosa\settings.json"; if (-not (Test-Path "$f.series")) { Copy-Item $f "$f.series" }; $s = Get-Content $f -Raw -Encoding UTF8 | ConvertFrom-Json; $s.endpoint = "http://127.0.0.1:9/v1"; $s.way = "own"; [IO.File]::WriteAllText($f, ($s | ConvertTo-Json -Depth 12))' ;;
  on) "$HERE/run.sh" '$f = "$env:APPDATA\de.mdd335.triglosa\settings.json"; if (Test-Path "$f.series") { Move-Item "$f.series" $f -Force }' ;;
  *) echo "off or on"; exit 1 ;;
esac
