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
  if ($LASTEXITCODE -ne 0) {
    throw "Concurrent registration invariant pgTAP test failed."
  }
  if ($testOutput -match "(?m)^\s*not ok\b") {
    throw "Concurrent registration invariant pgTAP assertions failed."
  }
}
finally {
  & docker exec $ContainerName psql -v ON_ERROR_STOP=1 -U supabase_admin -d postgres -c `
    "drop extension if exists dblink; drop extension if exists pgtap;"
}
