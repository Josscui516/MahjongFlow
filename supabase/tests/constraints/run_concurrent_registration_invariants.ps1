param(
  [string]$ContainerName = "supabase_db_MahjongFlow",
  [switch]$CleanupProbe
)

$ErrorActionPreference = "Stop"
$testFile = Join-Path $PSScriptRoot "concurrent_registration_invariants.pgtest"
$createdPgTap = $false
$createdDblink = $false
$grantedDblinkConnectU = $false
$existingExtensions = @()
$hadDblinkConnectU = $false
$pendingError = $null
$cleanupError = $null

try {
  $existingExtensions = @(& docker exec $ContainerName psql -At -U postgres -d postgres -c `
    "select extname from pg_extension where extname in ('pgtap', 'dblink') order by extname;")
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

  $dblinkPrivilege = & docker exec $ContainerName psql -At -U postgres -d postgres -c `
    "select has_function_privilege('postgres', 'extensions.dblink_connect_u(text, text)', 'execute');"
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to inspect dblink_connect_u privileges."
  }
  $hadDblinkConnectU = (($dblinkPrivilege | Out-String).Trim() -eq "t")
  if (-not $hadDblinkConnectU) {
    & docker exec $ContainerName psql -v ON_ERROR_STOP=1 -U supabase_admin -d postgres -c `
      "grant execute on function extensions.dblink_connect_u(text, text) to postgres;"
    if ($LASTEXITCODE -ne 0) {
      throw "Failed to grant temporary dblink_connect_u access."
    }
    $grantedDblinkConnectU = $true
  }

  if ($CleanupProbe) {
    throw "Injected cleanup probe after extension and privilege setup."
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
catch {
  $pendingError = $_
}
finally {
  if ($grantedDblinkConnectU -and -not $createdDblink) {
    & docker exec $ContainerName psql -v ON_ERROR_STOP=1 -U supabase_admin -d postgres -c `
      "revoke execute on function extensions.dblink_connect_u(text, text) from postgres;"
    if ($LASTEXITCODE -ne 0) {
      $cleanupError = "Failed to restore dblink_connect_u privileges."
    }
  }
  if ($createdDblink) {
    & docker exec $ContainerName psql -v ON_ERROR_STOP=1 -U postgres -d postgres -c `
      "drop extension dblink;"
    if ($LASTEXITCODE -ne 0) {
      $cleanupError = "Failed to remove the temporary dblink extension."
    }
  }
  if ($createdPgTap) {
    & docker exec $ContainerName psql -v ON_ERROR_STOP=1 -U postgres -d postgres -c `
      "drop extension pgtap;"
    if ($LASTEXITCODE -ne 0) {
      $cleanupError = "Failed to remove the temporary pgTAP extension."
    }
  }
}

if ($cleanupError) {
  throw $cleanupError
}

if ($CleanupProbe) {
  $restoredExtensions = @(& docker exec $ContainerName psql -At -U postgres -d postgres -c `
    "select extname from pg_extension where extname in ('pgtap', 'dblink') order by extname;")
  if ($LASTEXITCODE -ne 0) {
    throw "Cleanup probe could not inspect restored extensions."
  }
  if (($restoredExtensions -join "|") -ne ($existingExtensions -join "|")) {
    throw "Cleanup probe found that extension state was not restored."
  }

  if ($existingExtensions -contains "dblink") {
    $restoredPrivilege = & docker exec $ContainerName psql -At -U postgres -d postgres -c `
      "select has_function_privilege('postgres', 'extensions.dblink_connect_u(text, text)', 'execute');"
    if ($LASTEXITCODE -ne 0) {
      throw "Cleanup probe could not inspect restored dblink privileges."
    }
    $restoredHadPrivilege = (($restoredPrivilege | Out-String).Trim() -eq "t")
    if ($restoredHadPrivilege -ne $hadDblinkConnectU) {
      throw "Cleanup probe found that dblink_connect_u privileges were not restored."
    }
  }

  if (-not $pendingError -or $pendingError.Exception.Message -notlike "Injected cleanup probe*") {
    throw "Cleanup probe did not exercise the expected failure path."
  }
  Write-Output "Cleanup probe passed: extension and privilege state were restored."
  return
}

if ($pendingError) {
  throw $pendingError
}
