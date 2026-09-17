#!/bin/sh
# Runs PowerShell in the VM's logged-in desktop session, where windows can be
# seen, and prints what it wrote. The script comes from stdin, so it needs no
# quoting. `desk.sh shot out.png` photographs the screen instead.
HERE=$(cd "$(dirname "$0")" && pwd)
set -e
. "$HERE/host.sh"
KEY="$HOME/.ssh/triglosa_vm"
SSH="ssh -i $KEY -o BatchMode=yes -o LogLevel=ERROR $HOST"
if [ "$1" = "shot" ]; then
  $SSH 'powershell -NoProfile -ExecutionPolicy Bypass -File C:\triglosa-tools\gui.ps1 -Command "& C:\triglosa-tools\shot.ps1"' >/dev/null
  scp -q -i "$KEY" -o LogLevel=ERROR "$HOST:C:/triglosa-tools/shot.png" "$2"
  exit 0
fi
TMP=$(mktemp)
# Windows PowerShell reads a script without a byte order mark as ANSI.
printf '\357\273\277' > "$TMP"
cat >> "$TMP"
scp -q -i "$KEY" -o LogLevel=ERROR "$TMP" "$HOST:C:/triglosa-tools/desk-$$.ps1"
rm "$TMP"
$SSH "powershell -NoProfile -ExecutionPolicy Bypass -File C:\\triglosa-tools\\gui.ps1 -Timeout ${TIMEOUT:-120} -Command \"& C:\\triglosa-tools\\desk-$$.ps1\"" | LC_ALL=C tr -d '\r'
