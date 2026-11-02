#!/bin/sh
# A command in the macOS test VM over SSH, or a file to or from it:
#   vm.sh <command>            vm.sh get <remote> <local>   vm.sh put <local> <remote>
# The VM is Tart's "triglosa-test" (user admin), the key ~/.ssh/triglosa_mac_vm.
HOST=${TRIGLOSA_MAC_VM:-$(/opt/homebrew/bin/tart ip triglosa-test 2>/dev/null)}
O="-i $HOME/.ssh/triglosa_mac_vm -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR"
case "$1" in
  get) exec scp -q -r $O "admin@$HOST:$2" "$3" ;;
  put) exec scp -q -r $O "$2" "admin@$HOST:$3" ;;
  *) exec ssh $O "admin@$HOST" "$@" ;;
esac
