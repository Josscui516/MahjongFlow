param(
  [string]$ContainerName = "supabase_db_MahjongFlow"
)

$ErrorActionPreference = "Stop"
$testFile = Join-Path $PSScriptRoot "concurrent_registration_invariants.pgtest"

try {
  & docker exec $ContainerName psql -v ON_ERROR_STOP=1 -U postgres -d postgres -c `
    "create extension if not exists pgtap with schema extensions; create extension if not exists dblink with schema extensions;"
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to create temporary pgTAP and dblink extensions."
  }

  & docker exec $ContainerName psql -v ON_ERROR_STOP=1 -U supabase_admin -d postgres -c `
    "grant execute on function extensions.dblink_connect_u(text, text) to postgres;"
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to grant temporary dblink_connect_u access."
  }

  $testOutput = Get-Content -Raw $testFile |
    & docker exec -i $ContainerName psql -v ON_ERROR_STOP=1 -U postgres -d postgres 2>&1
  $testOutput | Write-Output
  $testText = $testOutput -join [Environment]::NewLine
  if ($LASTEXITCODE -ne 0) {
    throw "Concurrent registration invariant pgTAP test failed."
  }
  if ($testText -match "(?m)^\s*not ok\b") {
    throw "Concurrent registration invariant pgTAP assertions failed."
  }
  $planMatch = [regex]::Match($testText, "(?m)^\s*1\.\.(\d+)\s*$")
  $okCount = [regex]::Matches($testText, "(?m)^\s*ok\s+\d+\s+-").Count
  if (-not $planMatch.Success) {
    throw "Concurrent registration invariant pgTAP output has no valid plan."
  }
  if ($okCount -ne [int]$planMatch.Groups[1].Value) {
    throw "Concurrent registration invariant pgTAP output does not satisfy its plan."
  }
}
finally {
  & docker exec $ContainerName psql -v ON_ERROR_STOP=1 -U supabase_admin -d postgres -c `
    "drop extension if exists dblink; drop extension if exists pgtap;"
}
