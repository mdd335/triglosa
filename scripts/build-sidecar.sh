#!/usr/bin/env bash
# Builds the Swift translation helper and puts it where Tauri expects a
# sidecar: one binary per target, named with the target triple. The triple is
# the first argument (aarch64-apple-darwin or x86_64-apple-darwin), this
# machine's own where none is given.
set -euo pipefail
cd "$(dirname "$0")/.."
triple="${1:-$(rustc -vV | sed -n 's/^host: //p')}"
case "$triple" in
  aarch64-apple-darwin) arch=arm64 ;;
  x86_64-apple-darwin) arch=x86_64 ;;
  *) echo "no helper for $triple" >&2; exit 1 ;;
esac
# The deployment target is said outright: left to itself swiftc takes the
# build machine's system, and a helper built there refuses to start on the
# oldest macOS the app supports (minimumSystemVersion in tauri.macos.conf.json).
minos="$(sed -n 's/.*"minimumSystemVersion": *"\([^"]*\)".*/\1/p' src-tauri/tauri.macos.conf.json)"
mkdir -p src-tauri/binaries
swiftc -O -parse-as-library -target "$arch-apple-macos$minos" -o "src-tauri/binaries/translator-$triple" src-tauri/sidecar/translator.swift
echo "built src-tauri/binaries/translator-$triple"
