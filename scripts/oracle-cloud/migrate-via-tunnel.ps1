$ErrorActionPreference = 'Stop'

$workspace = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$envFile = Join-Path $workspace '.env'
$pgBin = 'C:\Program Files\PostgreSQL\18\bin'
$pgDump = Join-Path $pgBin 'pg_dump.exe'
$pgRestore = Join-Path $pgBin 'pg_restore.exe'

if (-not (Test-Path -LiteralPath $pgDump) -or -not (Test-Path -LiteralPath $pgRestore)) {
  throw 'PostgreSQL 18 client não encontrado em C:\Program Files\PostgreSQL\18\bin.'
}
if (-not $env:ORACLE_DATABASE_URL) {
  throw 'Defina ORACLE_DATABASE_URL apontando para o túnel SSH local, sem gravar a senha no repositório.'
}

$sourceLine = Get-Content -LiteralPath $envFile | Where-Object { $_ -match '^DATABASE_URL=' } | Select-Object -First 1
if (-not $sourceLine) { throw 'DATABASE_URL local não encontrada no .env.' }
$sourceUrl = $sourceLine.Substring('DATABASE_URL='.Length)
$dumpFile = Join-Path ([System.IO.Path]::GetTempPath()) ("faculdade-perto-{0}.dump" -f ([guid]::NewGuid().ToString('N')))

try {
  Write-Output 'Gerando dump lógico completo do PostgreSQL local...'
  & $pgDump --dbname=$sourceUrl --format=custom --compress=9 --no-owner --no-privileges --file=$dumpFile
  if ($LASTEXITCODE -ne 0) { throw "pg_dump falhou com código $LASTEXITCODE." }

  Write-Output 'Restaurando pelo túnel SSH no PostgreSQL Oracle...'
  & $pgRestore --dbname=$env:ORACLE_DATABASE_URL --exit-on-error --single-transaction --no-owner --no-privileges $dumpFile
  if ($LASTEXITCODE -ne 0) { throw "pg_restore falhou com código $LASTEXITCODE." }
} finally {
  if (Test-Path -LiteralPath $dumpFile) { Remove-Item -LiteralPath $dumpFile -Force }
}

Write-Output 'Migração concluída. Valide os totais e a API antes de alterar o ambiente de produção.'
