param(
  [string]$ContainerName = "supabase_db_MahjongFlow"
)

$ErrorActionPreference = "Stop"
$testFile = Join-Path $PSScriptRoot "concurrent_invariants.pgtest"
$createdPgTap = $false
$createdDblink = $false
$grantedDblinkConnectU = $false

try {
  $existingExtensions = & docker exec $ContainerName psql -At -U postgres -d postgres -c `
    "select extname from pg_extension where extname in ('pgtap', 'dblink') order by extname;"
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to inspect database test extensions."
  }

  if ($existingExtensions -notcontains "pgtap") {
    & docker exec $ContainerName psql -v ON_ERROR_STOP=1 -U postgres -d postgres -c `
      "create extension pgtap with schema extensions;"
    if ($LASTEXITCODE -ne 0) {
      throw "Failed to create the temporary pgTAP extension."
    }
    $createdPgTap = $true
  }
  if ($existingExtensions -notcontains "dblink") {
    & docker exec $ContainerName psql -v ON_ERROR_STOP=1 -U postgres -d postgres -c `
      "create extension dblink with schema extensions;"
    if ($LASTEXITCODE -ne 0) {
      throw "Failed to create the temporary dblink extension."
    }
    $createdDblink = $true
  }

  $hadDblinkConnectU = & docker exec $ContainerName psql -At -U postgres -d postgres -c `
    "select has_function_privilege('postgres', 'extensions.dblink_connect_u(text, text)', 'execute');"
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to inspect dblink_connect_u privileges."
  }
  if (($hadDblinkConnectU | Out-String).Trim() -ne "t") {
    & docker exec $ContainerName psql -v ON_ERROR_STOP=1 -U supabase_admin -d postgres -c `
      "grant execute on function extensions.dblink_connect_u(text, text) to postgres;"
    if ($LASTEXITCODE -ne 0) {
      throw "Failed to grant temporary dblink_connect_u access."
    }
    $grantedDblinkConnectU = $true
  }

  $testOutput = Get-Content -Raw $testFile |
    & docker exec -i $ContainerName psql -v ON_ERROR_STOP=1 -U postgres -d postgres 2>&1
  $testOutput | Write-Output
  $testText = $testOutput -join [Environment]::NewLine
  if ($LASTEXITCODE -ne 0) {
    throw "Concurrent invariant pgTAP test failed."
  }
  if ($testText -match "(?m)^\s*not ok\b") {
    throw "Concurrent invariant pgTAP assertions failed."
  }
  $planMatch = [regex]::Match($testText, "(?m)^\s*1\.\.(\d+)\s*$")
  $okCount = [regex]::Matches($testText, "(?m)^\s*ok\s+\d+\s+-").Count
  if (-not $planMatch.Success) {
    throw "Concurrent invariant pgTAP output has no valid plan."
  }
  if ($okCount -ne [int]$planMatch.Groups[1].Value) {
    throw "Concurrent invariant pgTAP output does not satisfy its plan."
  }
}
finally {
  if ($grantedDblinkConnectU -and -not $createdDblink) {
    & docker exec $ContainerName psql -v ON_ERROR_STOP=1 -U supabase_admin -d postgres -c `
      "revoke execute on function extensions.dblink_connect_u(text, text) from postgres;"
  }
  if ($createdDblink) {
    & docker exec $ContainerName psql -v ON_ERROR_STOP=1 -U postgres -d postgres -c `
      "drop extension dblink;"
  }
  if ($createdPgTap) {
    & docker exec $ContainerName psql -v ON_ERROR_STOP=1 -U postgres -d postgres -c `
      "drop extension pgtap;"
  }
}
