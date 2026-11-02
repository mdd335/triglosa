#!/bin/sh
# Builds the Store package in the VM, signs it with a test certificate of the
# Store's publisher name and installs it as the Store would, beside the
# installer's copy, then starts it. The Store's own signature comes later.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
"$HERE/sync.sh"
"$HERE/run.sh" 'Get-Process Triglosa -ErrorAction SilentlyContinue | Stop-Process -Force; node scripts/aligner-fetch.mjs; node scripts/ocr-fetch.mjs; cmd /c "npx tauri build --target x86_64-pc-windows-msvc --no-bundle 2>&1" | Select-String -Pattern "^error|could not compile|Built application" -Context 0,2 | % { $_.ToString() }; & .\scripts\windows\store-package.ps1 -Release src-tauri\target\x86_64-pc-windows-msvc\release'
printf '%s\n' \
  '$ErrorActionPreference = "Stop"' \
  '$subject = "CN=93292095-B9D2-42D0-8C18-82BA5BF8D343"' \
  '$cert = Get-ChildItem Cert:\CurrentUser\My | ? Subject -eq $subject | Select -First 1' \
  'if (-not $cert) { $cert = New-SelfSignedCertificate -Type Custom -Subject $subject -KeyUsage DigitalSignature -CertStoreLocation Cert:\CurrentUser\My -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.3", "2.5.29.19={text}") }' \
  'Export-Certificate -Cert $cert -FilePath C:\triglosa-tools\store-test.cer | Out-Null' | TIMEOUT=60 "$HERE/desk.sh"
"$HERE/run.sh" 'certutil -addstore TrustedPeople C:\triglosa-tools\store-test.cer | Select-Object -Last 1'
printf '%s\n' \
  '$ErrorActionPreference = "Stop"' \
  '$cert = Get-ChildItem Cert:\CurrentUser\My | ? Subject -eq "CN=93292095-B9D2-42D0-8C18-82BA5BF8D343" | Select -First 1' \
  '$msix = Get-ChildItem C:\triglosa\src-tauri\target\x86_64-pc-windows-msvc\release\bundle\store\*.msix | Select -Last 1' \
  '$signtool = Get-ChildItem "${env:ProgramFiles(x86)}\Windows Kits\10\bin\*\x64\signtool.exe" | Sort FullName | Select -Last 1' \
  '& $signtool.FullName sign /fd SHA256 /sha1 $cert.Thumbprint $msix.FullName' \
  'Get-AppxPackage Triglosa.Triglosa | Remove-AppxPackage' \
  'Add-AppxPackage $msix.FullName' \
  'Start-Process "shell:AppsFolder\$((Get-AppxPackage Triglosa.Triglosa).PackageFamilyName)!Triglosa"' \
  'Start-Sleep 5' \
  'Get-Process Triglosa | select Id, Path | Format-List' | TIMEOUT=180 "$HERE/desk.sh"
