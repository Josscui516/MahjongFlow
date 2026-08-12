param(
  [string]$ContainerName = "supabase_db_MahjongFlow"
)

$ErrorActionPreference = "Stop"
$testFile = Join-Path $PSScriptRoot "concurrent_invariants.pgtest"

try {
  & docker exec $ContainerName psql -v ON_ERROR_STOP=1 -U postgres -d postgres -c `
    "create extension if not exists pgtap with schema extensions; create extension if not exists dblink with schema extensions;"
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to create the temporary dblink extension."
  }

  & docker exec $ContainerName psql -v ON_ERROR_STOP=1 -U supabase_admin -d postgres -c `
    "grant execute on function extensions.dblink_connect_u(text, text) to postgres;"
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to grant temporary dblink_connect_u access."
  }

  Get-Content -Raw $testFile |
    & docker exec -i $ContainerName psql -v ON_ERROR_STOP=1 -U postgres -d postgres
  if ($LASTEXITCODE -ne 0) {
    throw "Concurrent invariant pgTAP test failed."
  }
}
finally {
  & docker exec $ContainerName psql -v ON_ERROR_STOP=1 -U supabase_admin -d postgres -c `
    "drop extension if exists dblink; drop extension if exists pgtap;"
}
