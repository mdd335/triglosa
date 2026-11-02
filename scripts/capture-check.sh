#!/bin/sh
# The word and the sentence under the pointer tried in both test machines,
# one after the other (16 GB hold one at a time): the Mac VM's Safari, Chrome
# and Firefox, then the Windows VM's Edge, Chrome and Firefox, every word of
# the test page from a freshly started browser, and on each system the short
# tour (tour.sh). About 40 minutes. Builds nothing: the Mac gets the app `npm
# run bundle` last built (scripts/mac-vm/install.sh), Windows keeps the one
# installed there (scripts/windows/install.sh or quick.sh first). Prints the
# misses and each count; leaves both machines off.
cd "$(dirname "$0")/.."
tart=/opt/homebrew/bin/tart

echo "== Mac"
"$tart" run --no-graphics triglosa-test >/dev/null 2>&1 &
"$tart" ip triglosa-test --wait 180 >/dev/null
sleep 20
scripts/mac-vm/install.sh
sleep 6
for browser in Safari Chrome Firefox; do
  scripts/mac-vm/series.sh --fresh "$browser" ws | grep -av '^ok'
done
scripts/mac-vm/tour.sh | grep -av '^ok'
"$tart" stop triglosa-test >/dev/null

echo "== Windows"
open ~/Parallels/"Windows 11.pvm"
for try in $(seq 1 36); do
  host=$(sh -c '. scripts/windows/host.sh; echo "$HOST"' 2>/dev/null)
  [ -n "$host" ] && break
  sleep 5
done
sleep 20
scripts/windows/no-model.sh off
first=--restart
for browser in Edge Chrome Firefox; do
  scripts/windows/series.sh $first --fresh --browser="$browser" ws | grep -av '^ok'
  first=
done
scripts/windows/tour.sh | grep -av '^ok'
scripts/windows/no-model.sh on
scripts/windows/run.sh 'shutdown /s /t 0' >/dev/null 2>&1 || true
