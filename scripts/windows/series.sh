#!/bin/sh
# A test series of the word and the sentence under the pointer in the
# Windows VM (series.ps1 does the pointing):
#   series.sh [--fresh] [--restart] [--browser=Edge|Chrome|Firefox] <w|s|ws> [words, a regular expression]
# PAGE=<url> takes another page than scripts/mac-vm/page.html. --restart
# starts Triglosa again first with its trace on and its window at the right
# edge, beside Edge, so it covers nothing; --fresh starts Edge again.
HERE=$(cd "$(dirname "$0")" && pwd)
. "$HERE/host.sh"
KEY="$HOME/.ssh/triglosa_vm"
fresh=""; restart=""; browser=Edge
while [ "${1#--}" != "$1" ]; do
  case "$1" in --fresh) fresh=" -Fresh" ;; --restart) restart=1 ;; --browser=*) browser=${1#--browser=} ;; esac
  shift
done
modes=$1; only=${2:-.}
ssh -i "$KEY" -o BatchMode=yes -o LogLevel=ERROR "$HOST" 'New-Item -ItemType Directory -Force C:\triglosa-tools\capture | Out-Null'
scp -q -i "$KEY" -o LogLevel=ERROR "$HERE/../mac-vm/page.html" "$HERE/../mac-vm/words.js" "$HERE/series.ps1" "$HERE/../mac-vm/firefox-user.js" "$HOST:C:/triglosa-tools/capture/"
scp -q -i "$KEY" -o LogLevel=ERROR "$HERE/restart.ps1" "$HOST:C:/triglosa-tools/capture/"
if [ -n "$restart" ]; then
  printf '%s\n' '$ErrorActionPreference = "Continue"' '& C:\triglosa-tools\capture\restart.ps1' | "$HERE/desk.sh" >/dev/null
fi
# The call is not the script's first line: after the byte order mark
# desk.sh writes, a line opening with "&" printed nothing.
printf '%s\n' '$ErrorActionPreference = "Continue"' "& C:\\triglosa-tools\\capture\\series.ps1 -Modes '$modes' -Only '$only' -Page '${PAGE:-}' -Browser '$browser'$fresh" | TIMEOUT=1500 "$HERE/desk.sh"
