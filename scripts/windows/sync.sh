#!/bin/sh
# Copies the working tree (tracked and untracked, nothing ignored) into the
# Windows VM at C:\triglosa, leaving its node_modules and target alone.
HERE=$(cd "$(dirname "$0")" && pwd)
set -e
cd "$(dirname "$0")/../.."
. "$HERE/host.sh"
KEY="$HOME/.ssh/triglosa_vm"
export COPYFILE_DISABLE=1
git ls-files -co --exclude-standard -z | tar --null -T - -czf /tmp/triglosa-sync.tgz
scp -q -i "$KEY" -o LogLevel=ERROR /tmp/triglosa-sync.tgz "$HOST:C:/triglosa-sync.tgz"
ssh -i "$KEY" -o BatchMode=yes -o LogLevel=ERROR "$HOST" 'New-Item -ItemType Directory -Force C:\triglosa | Out-Null; tar -xzf C:\triglosa-sync.tgz -C C:\triglosa; Remove-Item C:\triglosa-sync.tgz'
rm /tmp/triglosa-sync.tgz
