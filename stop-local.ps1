$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
& node supabase/local-stack.mjs stop
if ($LASTEXITCODE -ne 0) { throw 'Could not stop the local MahjongFlow stack. No volumes were deleted.' }
