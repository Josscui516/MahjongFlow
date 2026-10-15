param([switch]$Build)
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
$containers = @(docker ps -a --filter 'name=^supabase_.*_MahjongFlow$' --format '{{.Names}}')
if (!$containers.Count) { throw 'The existing MahjongFlow Supabase stack is missing; refusing to create or reset a database.' }
docker start @containers | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Could not start existing Supabase containers.' }
docker update --restart=always @containers | Out-Null
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
$arguments = @('compose', '--env-file', 'compose.local.env', 'up', '-d')
if ($Build) { $arguments += '--build' }
& docker @arguments
if ($LASTEXITCODE -ne 0) { throw 'Frontend startup failed.' }
Write-Output ('MahjongFlow: http://localhost:3000 | LAN: http://' + $address.IPAddress + ':3000')
