#!/usr/bin/env bash
# Builds the Swift translation helper and puts it where Tauri expects a
# sidecar: one binary per target, named with the target triple.
set -euo pipefail
cd "$(dirname "$0")/.."
triple="$(rustc -vV | sed -n 's/^host: //p')"
# The deployment target is said outright: left to itself swiftc takes the
# build machine's system, and a helper built there refuses to start on the
# oldest macOS the app supports (minimumSystemVersion in tauri.macos.conf.json).
minos="$(sed -n 's/.*"minimumSystemVersion": *"\([^"]*\)".*/\1/p' src-tauri/tauri.macos.conf.json)"
mkdir -p src-tauri/binaries
swiftc -O -parse-as-library -target "arm64-apple-macos$minos" -o "src-tauri/binaries/translator-$triple" src-tauri/sidecar/translator.swift
echo "built src-tauri/binaries/translator-$triple"
