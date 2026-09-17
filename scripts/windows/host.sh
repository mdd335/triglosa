# The VM's address. Parallels sometimes reports a stale one, so the address it
# names is used only where SSH answers there; otherwise the machine's other
# known addresses on its network are tried.
if [ -z "$TRIGLOSA_VM" ]; then
  for candidate in $(prlctl list -f | awk '/Windows 11/{print $3}') 10.211.55.3 10.211.55.4 10.211.55.5; do
    if nc -z -G 2 "$candidate" 22 2>/dev/null; then TRIGLOSA_VM=$candidate; break; fi
  done
fi
HOST=$TRIGLOSA_VM
