#!/bin/sh
# The Triglosa.app last built by `npm run bundle` into the VM, only what
# changed, then started with what it takes written to /tmp/triglosa.trace
# there (TRIGLOSA_TRACE) and its error output to /tmp/triglosa.err. Its
# window is put at the right edge of the screen, beside
# the browser series.sh opens, so it never covers what is pointed at.
here=$(dirname "$0")
app=$(cd "$here/../.." && pwd)/src-tauri/target/release/bundle/macos/Triglosa.app
host=${TRIGLOSA_MAC_VM:-$(/opt/homebrew/bin/tart ip triglosa-test)}
"$here/vm.sh" 'pkill -x Triglosa; true'
"$here/vm.sh" 'echo "{\"width\":400.0,\"height\":255.0,\"x\":1040.0,\"y\":36.0}" > ~/Library/Application\ Support/de.mdd335.triglosa/window.json'
rsync -a --delete -e "ssh -i $HOME/.ssh/triglosa_mac_vm -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR" "$app/" "admin@$host:/Applications/Triglosa.app/"
"$here/vm.sh" ': > /tmp/triglosa.err; touch /tmp/triglosa.trace; xattr -cr /Applications/Triglosa.app; open --env TRIGLOSA_TRACE=/tmp/triglosa.trace --stderr /tmp/triglosa.err /Applications/Triglosa.app'
