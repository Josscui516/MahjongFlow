param(
  [switch]$Build,
  [ValidateSet('Development', 'Production')]
  [string]$Mode = 'Production'
)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
function Test-DockerReady {
  $previousPreference = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  docker info --format '{{.ServerVersion}}' 2>$null | Out-Null
  $ready = $LASTEXITCODE -eq 0
  $ErrorActionPreference = $previousPreference
  return $ready
}
if (!(Test-DockerReady)) {
  Start-Process -FilePath 'C:\Program Files\Docker\Docker\Docker Desktop.exe' -WindowStyle Hidden
  for ($attempt = 0; $attempt -lt 30; $attempt++) {
    Start-Sleep -Seconds 2
    if (Test-DockerReady) { break }
  }
  if (!(Test-DockerReady)) { throw 'Docker Desktop did not start. Check its status and retry.' }
}
$containers = @('db', 'auth', 'rest', 'kong', 'inbucket', 'pg_meta', 'studio') |
  ForEach-Object { 'supabase_' + $_ + '_MahjongFlow' }
foreach ($container in $containers) {
  docker container inspect --format '{{.Name}}' $container 2>$null | Out-Null
  if ($LASTEXITCODE -ne 0) { throw ('Required existing container missing: ' + $container + '. No database was created or reset.') }
}
docker start @containers | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Could not start existing Supabase containers.' }
for ($attempt = 0; $attempt -lt 90; $attempt++) {
  $states = @(docker container inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' @containers)
  if ($LASTEXITCODE -ne 0) { throw 'Could not inspect Supabase readiness.' }
  if (@($states | Where-Object { $_ -notin @('healthy', 'running') }).Count -eq 0) { break }
  Start-Sleep -Seconds 1
}
if (@($states | Where-Object { $_ -notin @('healthy', 'running') }).Count -gt 0) {
  throw 'Supabase services did not become ready. Existing database volumes were retained.'
}
# Generate credentials privately; never show the status JSON or environment values.
$ErrorActionPreference = 'Continue'
$statusRaw = & "$PSScriptRoot\node_modules\.bin\supabase.cmd" status --output json 2>$null
$statusExit = $LASTEXITCODE
$ErrorActionPreference = 'Stop'
if ($statusExit -ne 0) { throw 'Supabase status unavailable. Retry when its containers are healthy.' }
$status = $statusRaw | ConvertFrom-Json
if (!$status.ANON_KEY -or !$status.SERVICE_ROLE_KEY) { throw 'Local Supabase credentials are unavailable.' }
$route = Get-NetRoute -DestinationPrefix '0.0.0.0/0' | Sort-Object RouteMetric | Select-Object -First 1
$address = Get-NetIPAddress -InterfaceIndex $route.InterfaceIndex -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -notmatch '^(127|169\.254)\.' } | Select-Object -First 1
if (!$address) { throw 'No active host LAN address found.' }
$values = @(
  ('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=' + $status.ANON_KEY),
  ('SUPABASE_SECRET_KEY=' + $status.SERVICE_ROLE_KEY),
  ('LOCAL_DOCKER_HOST_IP=' + $address.IPAddress)
)
[IO.File]::WriteAllLines((Join-Path $PSScriptRoot 'compose.local.env'), $values)
$arguments = @('supabase/local-stack.mjs', 'start', '--mode', $Mode.ToLowerInvariant())
if ($Build) { $arguments += '--build' }
& node @arguments
if ($LASTEXITCODE -ne 0) { throw 'Unified local stack startup failed. Existing database volumes were retained.' }
Write-Output ('MahjongFlow: http://localhost:3000 | LAN: http://' + $address.IPAddress + ':3000')
