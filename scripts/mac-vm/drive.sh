#!/bin/sh
# A shell line run in the VM's logged-in session through Driver.app, which
# holds Accessibility and Screen Recording there; $DRIVE is the helper itself
# (drive.sh '$DRIVE move 100 200; $DRIVE key ctrl+alt+w'). Prints its output.
here=$(dirname "$0")
id=$(date +%s)$$
printf '%s' "$*" | "$here/vm.sh" "mkdir -p /tmp/drive; cat > /tmp/drive/$id.part && mv /tmp/drive/$id.part /tmp/drive/$id.cmd; for i in \$(seq 1 600); do [ -f /tmp/drive/$id.out ] && { cat /tmp/drive/$id.out; rm /tmp/drive/$id.out; exit 0; }; sleep 0.1; done; echo timeout"
