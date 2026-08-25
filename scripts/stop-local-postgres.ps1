$ErrorActionPreference = 'Stop'
$workspace = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$cluster = Join-Path $workspace '.local-postgres\data'
$pgCtl = 'C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe'
if (Test-Path (Join-Path $cluster 'postmaster.pid')) { & $pgCtl stop -D $cluster -m fast -w }
