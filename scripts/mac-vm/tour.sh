#!/bin/bash
# The short tour in the VM: each way a text comes in or goes out, tried once
# for real in TextEdit, Preview, over a full-screen Safari and into Anki. One
# line a try; what Triglosa took is read from its trace, what it wrote from the
# program it wrote to. Starts Triglosa as install.sh does, with a stand-in for
# the AI model (scripts/tour-model.mjs, through a tunnel) in its settings, and
# puts the settings back afterwards.
here=$(cd "$(dirname "$0")" && pwd)
host=${TRIGLOSA_MAC_VM:-$(/opt/homebrew/bin/tart ip triglosa-test)}
key=$HOME/.ssh/triglosa_mac_vm
settings='~/Library/Application Support/de.mdd335.triglosa/settings.json'
answer="Inserted by the tour"
word=sentence
line="A tour sentence in a plain text editor."
pass=0; all=0
scratch=$(mktemp -d)

report() { # name, whether it held, what was seen
  all=$((all + 1))
  case "$2" in *1*) good=1 ;; *) good=0 ;; esac
  if [ "$good" = 1 ]; then pass=$((pass + 1)); mark=ok; else mark=XX; fi
  printf '%s %-14s %s\n' "$mark" "$1" "$3"
}
contains() { case "$1" in *"$2"*) echo 1 ;; *) echo 0 ;; esac; }
# What the shortcut brought: the keys or the line pressing them, then the
# trace's next line.
taken() {
  "$here/drive.sh" "n=\$(grep -c '^trace:' /tmp/triglosa.trace); $1; for t in \$(seq 1 ${2:-80}); do [ \$(grep -c '^trace:' /tmp/triglosa.trace) -gt \$n ] && break; sleep 0.1; done; grep '^trace:' /tmp/triglosa.trace | tail -n +\$((n + 1)) | tail -1"
}
field() { printf '%s' "$2" | sed -n "s/.*\"$1\":\"\([^\"]*\)\".*/\1/p"; }

node "$here/../tour-model.mjs" &
model=$!
ssh -i "$key" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR -N -R 1240:127.0.0.1:1240 "admin@$host" &
tunnel=$!
trap 'kill $model $tunnel 2>/dev/null; rm -rf "$scratch"' EXIT

"$here/vm.sh" 'mkdir -p /tmp/capture'
"$here/vm.sh" "cp \"\$HOME/${settings#\~/}\" /tmp/tour-settings.json"
"$here/vm.sh" get "/tmp/tour-settings.json" "$scratch/settings.json"
node -e '
  const fs = require("fs");
  const [file] = process.argv.slice(1);
  const s = JSON.parse(fs.readFileSync(file, "utf8"));
  s.endpoint = "http://127.0.0.1:1240/v1";
  s.model = "tour";
  s.way = "own";
  s.pinned = false;
  s.welcome = false;
  s.stats = false;
  s.languages = ["de", "en", "es"];
  s.hotkey = { accelerator: "Control+Alt+KeyT", label: "⌃⌥T" };
  s.cardHotkey = { accelerator: "Control+Alt+KeyK", label: "⌃⌥K" };
  s.cards = { ...s.cards, improve: false, anki: { enabled: true, sync: false, decks: { en: { deck: "Default", noteType: "Basic", fields: { term: "Front", meaning: "Back", note: "" } } } } };
  fs.writeFileSync(file, JSON.stringify(s, null, 2));
' "$scratch/settings.json"
"$here/vm.sh" 'pkill -x Triglosa; sleep 1'
"$here/vm.sh" put "$scratch/settings.json" /tmp/tour-new.json
"$here/vm.sh" "cp /tmp/tour-new.json \"\$HOME/${settings#\~/}\"; touch /tmp/triglosa.trace; open --env TRIGLOSA_TRACE=/tmp/triglosa.trace --stderr /tmp/triglosa.err /Applications/Triglosa.app"
sleep 6
"$here/vm.sh" put "$here/tour.pdf" /tmp/capture/tour.pdf
"$here/vm.sh" put "$here/page.html" /tmp/capture/page.html
"$here/vm.sh" "printf '%s\n' '$line' > /tmp/capture/tour.txt; pkill -x TextEdit; pkill -x Preview; pkill -x Safari; pkill -x Anki; sleep 1"

# A plain text editor: the word under the pointer, the selection, Insert.
"$here/drive.sh" "open -a TextEdit /tmp/capture/tour.txt; sleep 3" >/dev/null
read -r x y w h <<< "$("$here/drive.sh" "\$DRIVE bounds com.apple.TextEdit $word")"
got=$(taken "\$DRIVE move $((x + w / 2)) $((y + h / 2)); sleep 0.4; \$DRIVE key ctrl+alt+w")
report "editor word" "$([ "$(field text "$got")" = "$word" ] && echo 1)" "$(field by "$got") $(field text "$got")"
"$here/drive.sh" 'open -a TextEdit; sleep 1' >/dev/null
"$here/drive.sh" "\$DRIVE select com.apple.TextEdit $line" >/dev/null
got=$(taken "\$DRIVE key ctrl+alt+t")
report "selection" "$([ "$(field text "$got")" = "$line" ] && echo 1)" "$(field by "$got") $(field text "$got")"
sleep 3
read -r wx wy <<< "$("$here/drive.sh" "osascript -e 'tell application \"System Events\" to tell process \"Triglosa\" to get position of window 1' | tr -d ','")"
pressed=$("$here/drive.sh" "\$DRIVE move $((wx + 200)) $((wy + 90)); sleep 0.8; \$DRIVE press de.mdd335.triglosa Einfügen")
sleep 2
written=$("$here/drive.sh" '$DRIVE value com.apple.TextEdit')
report "insert" "$(contains "$written" "$answer")" "$pressed: $written"

# Text from a screenshot: the shortcut, then a frame over TextEdit's line, with
# the helper gone as it is after five minutes without a question.
"$here/vm.sh" 'pkill -x translator; true'
"$here/drive.sh" 'open -a TextEdit; sleep 1' >/dev/null
got=$(taken "\$DRIVE key ctrl+alt+f; sleep 1.5; \$DRIVE drag $((x - 120)) $((y - 8)) $((x + 330)) $((y + h + 8))" 120)
report "screenshot" "$(contains "$(field text "$got")" "tour")" "$(field by "$got") $(field text "$got")"

# A PDF in Preview: the sentence under the pointer.
"$here/drive.sh" "open -a Preview /tmp/capture/tour.pdf; sleep 3" >/dev/null
"$here/drive.sh" "osascript -e 'tell application \"System Events\" to tell process \"Preview\"' -e 'set frontmost to true' -e 'set position of window 1 to {100, 60}' -e 'set size of window 1 to {800, 760}' -e 'end tell'; sleep 1" >/dev/null
got=$(taken "\$DRIVE move 450 206; sleep 0.5; \$DRIVE key ctrl+alt+s" 200)
# Either line: where Preview puts the page moves with its window.
report "pdf" "$(contains "$(field text "$got")" "stands below it.")$(contains "$(field text "$got")" "in a document.")" "$(field by "$got") $(field text "$got")"
"$here/vm.sh" 'pkill -x Preview; pkill -x TextEdit'


# The reading window over a program's full screen.
"$here/drive.sh" "open -a Safari /tmp/capture/page.html; sleep 4; open -a Safari; sleep 1; [ \"\$(osascript -e 'tell application \"System Events\" to tell process \"Safari\" to get value of attribute \"AXFullScreen\" of window 1')\" = true ] || \$DRIVE key ctrl+cmd+f; sleep 4" >/dev/null
"$here/vm.sh" put "$here/words.js" /tmp/capture/words.js
spot=$("$here/drive.sh" "osascript -e 'tell application \"Safari\" to do JavaScript (read POSIX file \"/tmp/capture/words.js\" as «class utf8») in front document'" | awk -F'\t' '$1 == "brown" { print $2, $3 }')
got=$(taken "\$DRIVE move $spot; sleep 0.5; \$DRIVE key ctrl+alt+w")
sleep 1
full=$("$here/drive.sh" "osascript -e 'tell application \"System Events\" to tell process \"Safari\" to get value of attribute \"AXFullScreen\" of window 1'")
first=$("$here/drive.sh" '$DRIVE windows' | awk '$2 == 0 { print $1; exit }')
report "over full" "$([ "$full$first" = trueTriglosa ] && [ -n "$(field text "$got")" ] && echo 1)" "full screen $full, in front $first, took $(field text "$got")"
"$here/drive.sh" "open -a Safari; sleep 1; \$DRIVE key ctrl+cmd+f; sleep 3; osascript -e 'quit app \"Safari\"'" >/dev/null

# A card into Anki, the note looked for through AnkiConnect and taken out again.
anki() { "$here/vm.sh" "curl -s http://127.0.0.1:8765 -d '$1'"; }
"$here/drive.sh" 'open -a Anki' >/dev/null
for i in $(seq 1 30); do [ -n "$(anki '{"action":"version","version":6}')" ] && break; sleep 1; done
term=tour-$(date +%H%M%S)
"$here/vm.sh" "printf '%s\n' '$term' > /tmp/capture/tour.txt"
"$here/drive.sh" "open -a TextEdit /tmp/capture/tour.txt; sleep 3; \$DRIVE select com.apple.TextEdit $term; sleep 0.3; \$DRIVE key ctrl+alt+k; sleep 4" >/dev/null
pressed=$("$here/drive.sh" '$DRIVE press de.mdd335.triglosa In Anki speichern')
sleep 3
notes=$(anki "{\"action\":\"findNotes\",\"version\":6,\"params\":{\"query\":\"$term\"}}")
report "anki" "$(contains "$notes" '[1')" "$pressed $notes"
ids=$(printf '%s' "$notes" | sed -n 's/.*"result": *\(\[[^]]*\]\).*/\1/p')
[ -n "$ids" ] && anki "{\"action\":\"deleteNotes\",\"version\":6,\"params\":{\"notes\":$ids}}" >/dev/null
anki '{"action":"guiExitAnki","version":6}' >/dev/null
"$here/vm.sh" 'pkill -x TextEdit'


"$here/vm.sh" "pkill -x Triglosa; sleep 1; cp /tmp/tour-settings.json \"\$HOME/${settings#\~/}\"; open --env TRIGLOSA_TRACE=/tmp/triglosa.trace --stderr /tmp/triglosa.err /Applications/Triglosa.app"
echo "$pass of $all as expected (tour, Mac)"
