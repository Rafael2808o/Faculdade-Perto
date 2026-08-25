$ErrorActionPreference = 'Stop'
$workspace = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$cluster = Join-Path $workspace '.local-postgres\data'
$log = Join-Path $workspace '.local-postgres\postgres.log'
$pgBin = 'C:\Program Files\PostgreSQL\18\bin'
$port = 55432

if (-not (Test-Path (Join-Path $pgBin 'pg_ctl.exe'))) { throw 'PostgreSQL 18 não encontrado em C:\Program Files\PostgreSQL\18.' }
if (-not (Test-Path (Join-Path $cluster 'PG_VERSION'))) { throw 'Catálogo nacional local não inicializado. Consulte docs/operacao-catalogo-nacional.md.' }

$ready = & (Join-Path $pgBin 'pg_isready.exe') -h 127.0.0.1 -p $port -d faculdade_perto 2>$null
if ($LASTEXITCODE -ne 0) {
  & (Join-Path $pgBin 'pg_ctl.exe') start -D $cluster -o "-p $port" -l $log -w | Out-Null
}
Write-Output "PostgreSQL nacional pronto em 127.0.0.1:$port"
