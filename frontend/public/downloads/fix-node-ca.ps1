# Teach Node to trust your company's HTTPS-inspecting proxy.
#
# Windows and your browser already trust it - its root certificate is installed in
# the Windows certificate store. Node ships its own list of trusted authorities and
# does not read the Windows store, so it sees a certificate signed by an authority
# it has never heard of and refuses the connection. That is Node being careful, not
# a broken machine.
#
# This finds the root that actually signs the connection to the backend, exports
# it, and points Node at it via NODE_EXTRA_CA_CERTS. Nothing is disabled or
# bypassed: the certificate your company already trusts is simply added to the list
# Node checks against.
#
#   powershell -ExecutionPolicy Bypass -File fix-node-ca.ps1 -TargetHost your-backend-host
#
# TargetHost has no default: the backend's hosting target isn't fixed yet
# (ADR-012), so there is no single host to guess. Use the same host from your
# claude-usage.config.json's INGEST_URL, without the scheme or path.

param(
  [Parameter(Mandatory = $true)]
  [string]$TargetHost
)

$ErrorActionPreference = 'Stop'
$NL = [Environment]::NewLine

function Ok($m)   { Write-Host "  ok    $m" -ForegroundColor Green }
function Warn($m) { Write-Host "  note  $m" -ForegroundColor Yellow }
function Fail($m) { Write-Host "  FAIL  $m" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "Checking how HTTPS to $TargetHost is signed on this machine..."

# --- 1. Who actually signs the connection from here? ---
$tcp = $null
$ssl = $null
try {
  $tcp = [Net.Sockets.TcpClient]::new($TargetHost, 443)
  $ssl = [Net.Security.SslStream]::new($tcp.GetStream(), $false, { $true })
  $ssl.AuthenticateAsClient($TargetHost)
  $leaf = [Security.Cryptography.X509Certificates.X509Certificate2]$ssl.RemoteCertificate
  $chain = [Security.Cryptography.X509Certificates.X509Chain]::new()
  $null = $chain.Build($leaf)
  $root = $chain.ChainElements[$chain.ChainElements.Count - 1].Certificate
} catch {
  Fail "Could not open an HTTPS connection to ${TargetHost}: $($_.Exception.Message)"
} finally {
  if ($ssl) { $ssl.Dispose() }
  if ($tcp) { $tcp.Dispose() }
}

$rootName = ($root.Subject -split ',')[0] -replace '^CN=', ''
Ok "connection is signed by: $rootName"

# A well-known public authority means nothing is intercepting, so the certificate
# is not the problem here and adding it would not help.
$public = 'ISRG|DigiCert|Encrypt|Baltimore|GlobalSign|Amazon|Google Trust|Sectigo|USERTrust'
if ($rootName -match $public) {
  Warn "That is a public certificate authority, so nothing is intercepting HTTPS here."
  Warn "Node should already trust it. If push-usage.mjs still fails, the cause is"
  Warn "something else - send the error text to whoever set up the dashboard."
  exit 0
}

# --- 2. Export it ---
$dir = Join-Path $env:USERPROFILE '.certs'
if (-not (Test-Path $dir)) { $null = New-Item -ItemType Directory -Path $dir }

$safe = ($rootName -replace '[^A-Za-z0-9]+', '-').Trim('-').ToLower()
$pem = Join-Path $dir "$safe.pem"

$body = [Convert]::ToBase64String($root.RawData, 'InsertLineBreaks')
$lines = @('-----BEGIN CERTIFICATE-----', $body, '-----END CERTIFICATE-----')
Set-Content -Path $pem -Value ($lines -join $NL) -Encoding ascii
Ok "exported to $pem"

# --- 3. Point Node at it, now and for every future shell ---
$env:NODE_EXTRA_CA_CERTS = $pem
$null = setx NODE_EXTRA_CA_CERTS "$pem"
Ok "NODE_EXTRA_CA_CERTS set (this window, and saved for future ones)"

# --- 4. Prove it worked ---
Write-Host ""
Write-Host "Verifying..."
$js = "fetch('https://$TargetHost',{method:'HEAD'})" +
      ".then(r=>console.log('OK '+r.status))" +
      ".catch(e=>console.log('FAIL '+((e.cause&&e.cause.code)||e.message)))"
$result = (& node -e $js 2>&1 | Out-String).Trim()

if ($result -like 'OK*') {
  Ok "Node can now reach $TargetHost over HTTPS ($result)"
  Write-Host ""
  Write-Host "Done. Run the reporter again:"
  Write-Host "    node push-usage.mjs --dry-run"
  Write-Host ""
  Write-Host "If you already had another terminal open, close and reopen it first -"
  Write-Host "a saved environment variable only reaches newly started programs."
} else {
  Write-Host "  FAIL  Node still cannot connect: $result" -ForegroundColor Red
  Write-Host "        Send that line to whoever set up the dashboard."
  exit 1
}
