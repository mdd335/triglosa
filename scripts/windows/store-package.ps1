# Packs a built release into the MSIX package the Microsoft Store takes. The
# Store signs it. Same program as the installer's, which tells by its package
# identity that its updates come from the Store. The identity below is the
# one Partner Center gave the app, and must not change.
param(
  [string]$Release = "src-tauri\target\release",
  [string]$Out = "$Release\bundle\store"
)
$ErrorActionPreference = "Stop"

$version = (Get-Content src-tauri\tauri.conf.json -Raw | ConvertFrom-Json).version
$root = Join-Path $Out "package"
Remove-Item $Out -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path "$root\Assets" -Force | Out-Null
$root = (Resolve-Path $root).Path

Copy-Item "$Release\Triglosa.exe" $root
foreach ($folder in "aligner", "identifier", "ocr") {
  Copy-Item "src-tauri\resources\$folder" $root -Recurse
}

Add-Type -AssemblyName System.Drawing
$icon = [System.Drawing.Image]::FromFile((Resolve-Path "src-tauri\icons\icon.png"))
foreach ($asset in @(@("StoreLogo", 50), @("Square44x44Logo", 44), @("Square150x150Logo", 150))) {
  $size = $asset[1]
  $bitmap = New-Object System.Drawing.Bitmap $size, $size
  $canvas = [System.Drawing.Graphics]::FromImage($bitmap)
  $canvas.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $canvas.DrawImage($icon, 0, 0, $size, $size)
  $canvas.Dispose()
  $bitmap.Save("$root\Assets\$($asset[0]).png", [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Dispose()
}
$icon.Dispose()

@"
<?xml version="1.0" encoding="utf-8"?>
<Package xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10"
         xmlns:uap="http://schemas.microsoft.com/appx/manifest/uap/windows10"
         xmlns:rescap="http://schemas.microsoft.com/appx/manifest/foundation/windows10/restrictedcapabilities"
         IgnorableNamespaces="uap rescap">
  <Identity Name="Triglosa.Triglosa"
            Publisher="CN=93292095-B9D2-42D0-8C18-82BA5BF8D343"
            Version="$version.0"
            ProcessorArchitecture="x64" />
  <Properties>
    <DisplayName>Triglosa</DisplayName>
    <PublisherDisplayName>Triglosa</PublisherDisplayName>
    <Logo>Assets\StoreLogo.png</Logo>
  </Properties>
  <Dependencies>
    <TargetDeviceFamily Name="Windows.Desktop" MinVersion="10.0.19041.0" MaxVersionTested="10.0.26100.0" />
  </Dependencies>
  <Resources>
    <Resource Language="en-us" />
    <Resource Language="de-de" />
    <Resource Language="es-es" />
    <Resource Language="fr-fr" />
    <Resource Language="it-it" />
    <Resource Language="pt-br" />
    <Resource Language="ru-ru" />
  </Resources>
  <Applications>
    <Application Id="Triglosa" Executable="Triglosa.exe" EntryPoint="Windows.FullTrustApplication">
      <uap:VisualElements DisplayName="Triglosa"
                          Description="Reads selected text beside two translations and explains the words worth learning."
                          BackgroundColor="transparent"
                          Square150x150Logo="Assets\Square150x150Logo.png"
                          Square44x44Logo="Assets\Square44x44Logo.png" />
    </Application>
  </Applications>
  <Capabilities>
    <rescap:Capability Name="runFullTrust" />
  </Capabilities>
</Package>
"@ | Set-Content "$root\AppxManifest.xml" -Encoding UTF8

$makeappx = Get-ChildItem "${env:ProgramFiles(x86)}\Windows Kits\10\bin\*\x64\makeappx.exe" |
  Sort-Object FullName | Select-Object -Last 1
if (-not $makeappx) { throw "makeappx.exe not found: the Windows SDK is missing" }
$package = Join-Path $Out "Triglosa-$version-x64.msix"
& $makeappx.FullName pack /o /d $root /p $package
if ($LASTEXITCODE -ne 0) { throw "makeappx failed" }
Remove-Item $root -Recurse -Force
"packed: $package"
