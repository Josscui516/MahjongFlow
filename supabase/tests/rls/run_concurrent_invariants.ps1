param(
  [string]$ContainerName = "supabase_db_MahjongFlow",
  [switch]$CleanupProbe
)

$ErrorActionPreference = "Stop"
$testFile = Join-Path $PSScriptRoot "concurrent_invariants.pgtest"
$createdPgTap = $false
$createdDblink = $false
$grantedDblinkConnectU = $false
$existingExtensions = @()
$hadDblinkConnectU = $false
$pendingError = $null
$cleanupErrors = [System.Collections.Generic.List[string]]::new()
$cleanupProbeTokenId = "95999999-9999-4999-8999-999999999999"

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
    & docker exec $ContainerName psql -v ON_ERROR_STOP=1 -U postgres -d postgres -c `
      "alter table public.meeting_attendees disable trigger meeting_attendees_prevent_last_delete; insert into public.event_check_in_tokens (id, event_id, token_digest, created_by) select '$cleanupProbeTokenId', e.id, repeat('f', 64), p.id from public.events e cross join lateral (select id from public.profiles where committee_role = 'authorised' order by id limit 1) p where not exists (select 1 from public.event_check_in_tokens t where t.event_id = e.id and t.revoked_at is null) order by e.id limit 1;"
    if ($LASTEXITCODE -ne 0) {
      throw "Failed to prepare the cleanup probe fixture."
    }
    $probeRowCount = & docker exec $ContainerName psql -At -U postgres -d postgres -c `
      "select count(*) from public.event_check_in_tokens where id = '$cleanupProbeTokenId';"
    if ($LASTEXITCODE -ne 0 -or ($probeRowCount | Out-String).Trim() -ne "1") {
      throw "Cleanup probe did not create its target token fixture."
    }
    throw "Injected cleanup probe after persistent fixture setup."
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
catch {
  $pendingError = $_
}
finally {
  & docker exec $ContainerName psql -v ON_ERROR_STOP=1 -U postgres -d postgres -c `
    "alter table public.meeting_attendees enable trigger meeting_attendees_prevent_last_delete;"
  if ($LASTEXITCODE -ne 0) {
    $cleanupErrors.Add("Failed to restore the meeting attendee trigger.")
  }

  & docker exec $ContainerName psql -v ON_ERROR_STOP=1 -U postgres -d postgres -c `
    "begin; delete from public.attendance_records where event_id in ('95100000-0000-4000-8000-000000000001', '95100000-0000-4000-8000-000000000002'); delete from public.registrations where event_id in ('95100000-0000-4000-8000-000000000001', '95100000-0000-4000-8000-000000000002'); delete from public.event_check_in_tokens where id = '$cleanupProbeTokenId' or event_id in ('95100000-0000-4000-8000-000000000001', '95100000-0000-4000-8000-000000000002'); delete from public.participants where id in ('95200000-0000-4000-8000-000000000001', '95200000-0000-4000-8000-000000000002'); delete from public.events where id in ('95100000-0000-4000-8000-000000000001', '95100000-0000-4000-8000-000000000002'); commit;"
  if ($LASTEXITCODE -ne 0) {
    $cleanupErrors.Add("Failed to remove concurrent check-in fixtures.")
  }

  & docker exec $ContainerName psql -v ON_ERROR_STOP=1 -U postgres -d postgres -c `
    "begin; alter table public.meeting_attendees disable trigger meeting_attendees_prevent_last_delete; delete from public.meetings where id = '95000000-0000-4000-8000-000000000001'; alter table public.meeting_attendees enable trigger meeting_attendees_prevent_last_delete; commit;"
  if ($LASTEXITCODE -ne 0) {
    $cleanupErrors.Add("Failed to remove the concurrent meeting fixture.")
  }

  & docker exec $ContainerName psql -v ON_ERROR_STOP=1 -U postgres -d postgres -c `
    "begin; delete from public.profiles where id in ('94444444-4444-4444-8444-444444444444', '95555555-5555-4555-8555-555555555555'); delete from auth.users where id in ('94444444-4444-4444-8444-444444444444', '95555555-5555-4555-8555-555555555555'); commit;"
  if ($LASTEXITCODE -ne 0) {
    $cleanupErrors.Add("Failed to remove concurrent authentication fixtures.")
  }

  if ($grantedDblinkConnectU -and -not $createdDblink) {
    & docker exec $ContainerName psql -v ON_ERROR_STOP=1 -U supabase_admin -d postgres -c `
      "revoke execute on function extensions.dblink_connect_u(text, text) from postgres;"
    if ($LASTEXITCODE -ne 0) {
      $cleanupErrors.Add("Failed to restore dblink_connect_u privileges.")
    }
  }
  if ($createdDblink) {
    & docker exec $ContainerName psql -v ON_ERROR_STOP=1 -U postgres -d postgres -c `
      "drop extension dblink;"
    if ($LASTEXITCODE -ne 0) {
      $cleanupErrors.Add("Failed to remove the temporary dblink extension.")
    }
  }
  if ($createdPgTap) {
    & docker exec $ContainerName psql -v ON_ERROR_STOP=1 -U postgres -d postgres -c `
      "drop extension pgtap;"
    if ($LASTEXITCODE -ne 0) {
      $cleanupErrors.Add("Failed to remove the temporary pgTAP extension.")
    }
  }
}

if ($cleanupErrors.Count -gt 0) {
  throw ($cleanupErrors -join " ")
}

if ($CleanupProbe) {
  $probeState = & docker exec $ContainerName psql -At -U postgres -d postgres -c `
    "select (select tgenabled::text from pg_trigger where tgrelid = 'public.meeting_attendees'::regclass and tgname = 'meeting_attendees_prevent_last_delete') || '|' || (select count(*)::text from public.event_check_in_tokens where id = '$cleanupProbeTokenId');"
  if ($LASTEXITCODE -ne 0 -or ($probeState | Out-String).Trim() -ne "O|0") {
    throw "Cleanup probe found a disabled trigger or persisted token fixture."
  }

  $restoredExtensions = @(& docker exec $ContainerName psql -At -U postgres -d postgres -c `
    "select extname from pg_extension where extname in ('pgtap', 'dblink') order by extname;")
  if ($LASTEXITCODE -ne 0 -or ($restoredExtensions -join "|") -ne ($existingExtensions -join "|")) {
    throw "Cleanup probe found that extension state was not restored."
  }
  if ($existingExtensions -contains "dblink") {
    $restoredPrivilege = & docker exec $ContainerName psql -At -U postgres -d postgres -c `
      "select has_function_privilege('postgres', 'extensions.dblink_connect_u(text, text)', 'execute');"
    if ($LASTEXITCODE -ne 0 -or ((($restoredPrivilege | Out-String).Trim() -eq "t") -ne $hadDblinkConnectU)) {
      throw "Cleanup probe found that dblink_connect_u privileges were not restored."
    }
  }
  if (-not $pendingError -or $pendingError.Exception.Message -notlike "Injected cleanup probe*") {
    throw "Cleanup probe did not exercise the expected failure path."
  }
  Write-Output "Cleanup probe passed: trigger, token, fixture, extension, and privilege state were restored."
  return
}

if ($pendingError) {
  throw $pendingError
}
