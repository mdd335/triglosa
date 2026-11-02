#!/bin/sh
# Builds Driver.app from driver.swift and puts it into the VM. Its signature
# is pinned to its identifier, as scripts/sign.mjs pins Triglosa's, so a new
# build keeps the permissions granted to the last one.
set -e
here=$(cd "$(dirname "$0")" && pwd)
out=$(mktemp -d)/Driver.app
mkdir -p "$out/Contents/MacOS"
swiftc -O -target arm64-apple-macos26.0 "$here/driver.swift" -o "$out/Contents/MacOS/driver"
cat > "$out/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleIdentifier</key><string>test.vm.driver</string>
<key>CFBundleName</key><string>Driver</string>
<key>CFBundleExecutable</key><string>driver</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>LSUIElement</key><true/>
</dict></plist>
PLIST
codesign -s - -f --identifier test.vm.driver -r='designated => identifier "test.vm.driver"' "$out"
"$here/vm.sh" 'pkill -f Driver.app/Contents/MacOS/driver; rm -rf /Applications/Driver.app'
"$here/vm.sh" put "$out" /Applications/
"$here/vm.sh" 'open /Applications/Driver.app'
