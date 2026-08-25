#!/usr/bin/env bash
set -Eeuo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Execute com sudo -E para preservar as variáveis FP_DB_* sem gravá-las no histórico." >&2
  exit 1
fi

: "${FP_DB_PASSWORD:?Defina FP_DB_PASSWORD antes de executar.}"
FP_DB_NAME="${FP_DB_NAME:-faculdade_perto}"
FP_DB_USER="${FP_DB_USER:-faculdade}"

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl gnupg postgresql-common

install -d -m 0755 /usr/share/postgresql-common/pgdg
curl --fail --silent --show-error https://www.postgresql.org/media/keys/ACCC4CF8.asc \
  | gpg --dearmor --yes --output /usr/share/postgresql-common/pgdg/apt.postgresql.org.gpg
. /etc/os-release
echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.gpg] https://apt.postgresql.org/pub/repos/apt ${VERSION_CODENAME}-pgdg main" \
  > /etc/apt/sources.list.d/pgdg.list

apt-get update
apt-get install -y postgresql-18 postgresql-client-18
systemctl enable --now postgresql

runuser -u postgres -- psql --set ON_ERROR_STOP=1 \
  --set=db_user="${FP_DB_USER}" \
  --set=db_password="${FP_DB_PASSWORD}" \
  --set=db_name="${FP_DB_NAME}" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'db_user', :'db_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'db_user') \gexec
SELECT format('ALTER ROLE %I WITH LOGIN PASSWORD %L', :'db_user', :'db_password') \gexec
SELECT format('CREATE DATABASE %I OWNER %I', :'db_name', :'db_user')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'db_name') \gexec
SQL

# O banco fica acessível somente dentro da VM. Administração e migração usam
# túnel SSH; não abra a porta 5432 no Security List/NSG da Oracle.
PG_CONF="/etc/postgresql/18/main/postgresql.conf"
sed -ri "s/^#?listen_addresses\s*=.*/listen_addresses = '127.0.0.1'/" "${PG_CONF}"
sed -ri "s/^#?password_encryption\s*=.*/password_encryption = 'scram-sha-256'/" "${PG_CONF}"
systemctl restart postgresql

install -d -o postgres -g postgres -m 0700 /var/backups/faculdade-perto
cat > /usr/local/sbin/faculdade-perto-db-backup <<EOF
#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
backup_dir=/var/backups/faculdade-perto
stamp=\$(date -u +%Y%m%dT%H%M%SZ)
/usr/lib/postgresql/18/bin/pg_dump --format=custom --compress=9 --dbname='${FP_DB_NAME}' --file="\${backup_dir}/faculdade-perto-\${stamp}.dump"
find "\${backup_dir}" -type f -name 'faculdade-perto-*.dump' -mtime +7 -delete
EOF
chown postgres:postgres /usr/local/sbin/faculdade-perto-db-backup
chmod 0750 /usr/local/sbin/faculdade-perto-db-backup

cat > /etc/cron.d/faculdade-perto-db-backup <<'EOF'
17 3 * * * postgres /usr/local/sbin/faculdade-perto-db-backup
EOF
chmod 0644 /etc/cron.d/faculdade-perto-db-backup

runuser -u postgres -- /usr/local/sbin/faculdade-perto-db-backup
echo "PostgreSQL 18 pronto em localhost:5432, com backup diário e retenção de 7 dias."
