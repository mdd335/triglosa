#!/bin/sh
# The VM's screen at its size in points, into the file given (a PNG).
here=$(dirname "$0")
"$here/drive.sh" 'screencapture -x /tmp/shot.png' >/dev/null && "$here/vm.sh" get /tmp/shot.png "$1" && sips -Z 1440 "$1" >/dev/null
