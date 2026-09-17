#!/bin/sh
# Runs a PowerShell command in the VM from C:\triglosa with the tool paths set.
HERE=$(cd "$(dirname "$0")" && pwd)
. "$HERE/host.sh"
exec ssh -i "$HOME/.ssh/triglosa_vm" -o BatchMode=yes -o LogLevel=ERROR "$HOST" \
  "\$env:Path=[Environment]::GetEnvironmentVariable('Path','Machine')+';'+[Environment]::GetEnvironmentVariable('Path','User'); Set-Location C:\\triglosa; \$ErrorActionPreference='Continue'; $*" 
