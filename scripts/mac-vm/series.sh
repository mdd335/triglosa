#!/bin/bash
# A test series of the word and the sentence under the pointer in the VM:
#   series.sh [--fresh] <Safari|Chrome|Firefox> <w|s|ws> [words, a regular expression]
# Puts page.html into the browser, asks it where each word stands
# (words.js), points at each and presses the shortcut — ⌃⌥W for the word,
# ⌃⌥S for the sentence, as the VM's settings hold them — and reads what
# Triglosa took from its trace (install.sh starts it with one, its window
# beside the browser's). One line a
# try: whether it matched, the shortcut, the word, where the text came from
# and what came. --fresh quits the browser first, so the first try is the
# first the browser is asked. PAGE=<url> takes another page; its words are
# the first 40 of its paragraphs, and it is not scrolled.
here=$(cd "$(dirname "$0")" && pwd)
fresh=""; [ "$1" = "--fresh" ] && { fresh=1; shift; }
app=$1; modes=$2; only=${3:-.}
page=${PAGE:-/tmp/capture/page.html}
case "$app" in
  Chrome) name="Google Chrome" ;;
  *) name=$app ;;
esac
"$here/vm.sh" 'mkdir -p /tmp/capture'
"$here/vm.sh" put "$here/page.html" /tmp/capture/page.html
"$here/vm.sh" put "$here/words.js" /tmp/capture/words.js
if [ "$app" = Firefox ]; then
  # A profile of its own every time, nothing in front of the page. The VM has
  # no WebSocket client: Node asks here, through a tunnel, on Firefox's own
  # port, as Firefox refuses a connection addressed to any other.
  "$here/vm.sh" put "$here/firefox-user.js" /tmp/capture/firefox-user.js
  "$here/vm.sh" 'pkill -x firefox; sleep 1; rm -rf /tmp/capture/firefox; mkdir /tmp/capture/firefox; cp /tmp/capture/firefox-user.js /tmp/capture/firefox/user.js'
  "$here/drive.sh" "nohup /Applications/Firefox.app/Contents/MacOS/firefox -profile /tmp/capture/firefox -no-remote --remote-debugging-port 9222 -width 1030 -height 840 '$page' >/dev/null 2>&1 & sleep 7" >/dev/null
  "$here/vm.sh" "osascript -e 'quit app \"Google Chrome\"' -e 'quit app \"Safari\"'"
  "$here/drive.sh" "osascript -e 'tell application \"System Events\" to tell process \"firefox\" to set position of front window to {0, 30}'; sleep 1" >/dev/null
  host=${TRIGLOSA_MAC_VM:-$(/opt/homebrew/bin/tart ip triglosa-test)}
  ssh -i "$HOME/.ssh/triglosa_mac_vm" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR -N -L 9222:127.0.0.1:9222 "admin@$host" &
  tunnel=$!
  trap 'kill $tunnel 2>/dev/null' EXIT
  sleep 2
  words=$(node "$here/firefox-words.mjs" 9222 "$here/words.js")
elif [ "$app" = Chrome ]; then
  # A data folder of its own every time, so no notice of a first start lies
  # over the page; Chrome scripts its own tabs only where that is allowed.
  if [ -n "$fresh" ]; then
    "$here/vm.sh" "osascript -e 'tell application \"$name\" to quit'; sleep 2; pkill -x 'Google Chrome'; rm -rf /tmp/capture/chrome; mkdir -p /tmp/capture/chrome/Default; touch '/tmp/capture/chrome/First Run'; echo '{\"browser\":{\"allow_javascript_apple_events\":true}}' > /tmp/capture/chrome/Default/Preferences; true"
  fi
  "$here/drive.sh" "open -a '$name' --args --user-data-dir=/tmp/capture/chrome --no-first-run --no-default-browser-check --hide-crash-restore-bubble --disable-features=PrivacySandboxSettings4 '$page'; sleep 5" >/dev/null
  "$here/vm.sh" "osascript -e 'tell application \"$name\" to activate' -e 'tell application \"$name\" to set bounds of front window to {0, 30, 1030, 870}'; sleep 1" >/dev/null
  words=$("$here/vm.sh" "osascript -e 'tell application \"Google Chrome\" to execute active tab of front window javascript (read POSIX file \"/tmp/capture/words.js\" as «class utf8»)'")
else
  # Safari lets Driver.app script its windows (allowed once in the VM).
  [ -n "$fresh" ] && "$here/drive.sh" "osascript -e 'tell application \"$name\" to quit'; sleep 2"
  "$here/drive.sh" "open -a '$name' '$page'; sleep 5" >/dev/null
  "$here/drive.sh" "osascript -e 'tell application \"$name\" to activate' -e 'tell application \"$name\" to set bounds of front window to {0, 30, 1030, 870}'; sleep 1" >/dev/null
  words=$("$here/drive.sh" "osascript -e 'tell application \"Safari\" to do JavaScript (read POSIX file \"/tmp/capture/words.js\" as «class utf8») in front document'")
fi
[ -z "$words" ] && { echo "the browser told no word positions"; exit 1; }
pass=0; all=0
[ -n "$PAGE" ] && words=$(printf '%s\n' "$words" | awk -F'\t' '$3 > 150 && $3 < 820' | head -40)
while IFS=$'\t' read -r word x y sentence; do
  [[ "$word" =~ $only ]] || continue
  for (( i = 0; i < ${#modes}; i++ )); do
    mode=${modes:i:1}
    # A sentence once, from its first word.
    if [ "$mode" = s ] && [ "$only" = . ]; then
      case "$seen" in *"|$sentence|"*) continue ;; esac
      seen="$seen|$sentence|"
    fi
    [ "$mode" = w ] && { key=ctrl+alt+w; want=$word; } || { key=ctrl+alt+s; want=$sentence; }
    got=$("$here/drive.sh" "n=\$(grep -c '^trace:' /tmp/triglosa.trace); open -a '$name'; sleep 0.6; \$DRIVE move $x $y; sleep 0.4; \$DRIVE key $key; for t in \$(seq 1 80); do [ \$(grep -c '^trace:' /tmp/triglosa.trace) -gt \$n ] && break; sleep 0.1; done; grep '^trace:' /tmp/triglosa.trace | tail -n +\$((n + 1)) | tail -1")
    text=$(printf '%s' "$got" | sed -n 's/.*"text":"\([^"]*\)".*/\1/p')
    by=$(printf '%s' "$got" | sed -n 's/.*"by":"\([^"]*\)".*/\1/p')
    [ -z "$got" ] && got="(nothing)"
    all=$((all + 1))
    if [ "$text" = "$want" ]; then mark=ok; pass=$((pass + 1)); else mark=XX; fi
    printf '%s %s %-12s %-8s %s\n' "$mark" "$mode" "$word" "${by:--}" "${text:-${got#trace: }}"
  done
done <<< "$words"
echo "$pass of $all as expected ($app)"
