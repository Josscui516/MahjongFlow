#!/usr/bin/env bash

set -euo pipefail

container_name="${1:-supabase_db_MahjongFlow}"
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
test_file="${script_dir}/concurrent-participant-identity.pgtest"
created_pgtap=false
created_dblink=false
granted_dblink_connect_u=false
test_status=0

cleanup() {
  local cleanup_status=0

  docker exec "${container_name}" psql -v ON_ERROR_STOP=1 -U postgres \
    -d postgres -c \
    "delete from public.participants where id in ('c6600000-0000-4000-8000-000000000001', 'c6600000-0000-4000-8000-000000000002') or email = 'issue-26-concurrent@example.test';" \
    >/dev/null || cleanup_status=1

  if [[ "${granted_dblink_connect_u}" == "true" && "${created_dblink}" == "false" ]]; then
    docker exec "${container_name}" psql -v ON_ERROR_STOP=1 -U supabase_admin \
      -d postgres -c \
      "revoke execute on function extensions.dblink_connect_u(text, text) from postgres;" \
      >/dev/null || cleanup_status=1
  fi

  if [[ "${created_dblink}" == "true" ]]; then
    docker exec "${container_name}" psql -v ON_ERROR_STOP=1 -U postgres \
      -d postgres -c "drop extension dblink;" >/dev/null || cleanup_status=1
  fi

  if [[ "${created_pgtap}" == "true" ]]; then
    docker exec "${container_name}" psql -v ON_ERROR_STOP=1 -U postgres \
      -d postgres -c "drop extension pgtap;" >/dev/null || cleanup_status=1
  fi

  if [[ "${cleanup_status}" -ne 0 ]]; then
    echo "Failed to restore the participant concurrency test environment." >&2
    return 1
  fi

  return 0
}

finish() {
  local command_status=$?
  local cleanup_status=0

  trap - EXIT
  set +e
  cleanup
  cleanup_status=$?
  set -e

  if [[ "${cleanup_status}" -ne 0 ]]; then
    exit "${cleanup_status}"
  fi

  exit "${command_status}"
}

trap finish EXIT

existing_extensions="$({
  docker exec "${container_name}" psql -At -U postgres -d postgres -c \
    "select extname from pg_extension where extname in ('pgtap', 'dblink') order by extname;"
})"

if ! grep -qx "pgtap" <<<"${existing_extensions}"; then
  docker exec "${container_name}" psql -v ON_ERROR_STOP=1 -U postgres \
    -d postgres -c "create extension pgtap with schema extensions;"
  created_pgtap=true
fi

if ! grep -qx "dblink" <<<"${existing_extensions}"; then
  docker exec "${container_name}" psql -v ON_ERROR_STOP=1 -U postgres \
    -d postgres -c "create extension dblink with schema extensions;"
  created_dblink=true
fi

had_dblink_connect_u="$(
  docker exec "${container_name}" psql -At -U postgres -d postgres -c \
    "select has_function_privilege('postgres', 'extensions.dblink_connect_u(text, text)', 'execute');"
)"

if [[ "${had_dblink_connect_u}" != "t" ]]; then
  docker exec "${container_name}" psql -v ON_ERROR_STOP=1 -U supabase_admin \
    -d postgres -c \
    "grant execute on function extensions.dblink_connect_u(text, text) to postgres;"
  granted_dblink_connect_u=true
fi

set +e
test_output="$(
  docker exec -i "${container_name}" psql -v ON_ERROR_STOP=1 -U postgres \
    -d postgres <"${test_file}" 2>&1
)"
test_status=$?
set -e

printf '%s\n' "${test_output}"

if [[ "${test_status}" -ne 0 ]]; then
  exit "${test_status}"
fi

if grep -Eq '^[[:space:]]*not ok\b' <<<"${test_output}"; then
  echo "Concurrent participant identity assertions failed." >&2
  exit 1
fi

plan_count="$(
  sed -nE 's/^[[:space:]]*1\.\.([0-9]+)[[:space:]]*$/\1/p' \
    <<<"${test_output}" | tail -n 1
)"
ok_count="$(grep -Ec '^[[:space:]]*ok[[:space:]]+[0-9]+[[:space:]]+-' \
  <<<"${test_output}" || true)"

if [[ -z "${plan_count}" || "${ok_count}" -ne "${plan_count}" ]]; then
  echo "Concurrent participant identity output does not satisfy its plan." >&2
  exit 1
fi
