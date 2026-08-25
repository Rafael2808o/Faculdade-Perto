# Oracle Cloud como alternativa autogerenciada

O banco principal de produção é o CockroachDB Basic. Esta opção permanece documentada para uma instalação PostgreSQL autogerenciada na Oracle Cloud Always Free. Ela exige administrar VM, atualizações, firewall, backup e disponibilidade; por isso não é o caminho operacional atual.

## Arquitetura

- VM Oracle Cloud Always Free Ampere A1;
- Ubuntu 24.04 LTS;
- PostgreSQL 18;
- API Express executada na mesma VM;
- PostgreSQL ouvindo somente em `127.0.0.1:5432`;
- acesso administrativo por túnel SSH;
- backup `pg_dump` diário, retenção local de 7 dias;
- backup de volume da Oracle configurado separadamente.

Não adicione uma regra de entrada para a porta 5432 no NSG ou Security List. Somente HTTP/HTTPS e SSH restrito ao IP administrativo devem ser publicados.

## VM recomendada dentro do Always Free

- shape `VM.Standard.A1.Flex`;
- 2 OCPUs e 12 GB de memória;
- boot volume de 100 GB;
- região residencial da conta, preferindo Brasil quando houver capacidade;
- chave SSH criada para este projeto, sem reutilizar senha de outro serviço.

Antes de confirmar, verifique que todos os recursos exibem o selo **Always Free eligible** e que o custo estimado é zero.

## Bootstrap

Copie `scripts/oracle-cloud/bootstrap-postgres.sh` para a VM. Gere uma senha exclusiva fora do histórico e execute:

```bash
read -rsp 'Senha do banco: ' FP_DB_PASSWORD && export FP_DB_PASSWORD
sudo -E bash bootstrap-postgres.sh
unset FP_DB_PASSWORD
```

O script instala o PostgreSQL 18, cria o usuário e o banco, restringe a escuta a localhost e realiza o primeiro backup.

## Túnel e migração

Na máquina local, abra um túnel usando a chave SSH da VM:

```powershell
ssh -i "CAMINHO_DA_CHAVE" -L 55433:127.0.0.1:5432 ubuntu@IP_PUBLICO_DA_VM
```

Em outro terminal, defina temporariamente a URL do destino e rode a migração:

```powershell
$env:ORACLE_DATABASE_URL='postgres://faculdade:SENHA@127.0.0.1:55433/faculdade_perto'
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/oracle-cloud/migrate-via-tunnel.ps1
Remove-Item Env:ORACLE_DATABASE_URL
```

## Validação obrigatória

- 2.561 instituições;
- 720.349 registros censitários;
- 353 cursos canônicos;
- 3.551 municípios;
- zero rejeições na carga validada;
- `npm test` e `npm run build` aprovados;
- `/api/health` com `DATABASE_PROVIDER=oracle` e banco disponível;
- busca, detalhes e mapa funcionando antes de qualquer corte do banco local.

## Rollback

O PostgreSQL local não deve ser apagado. Se a validação remota falhar, restaure a `DATABASE_URL` local e reinicie a API. Nunca destrua a VM ou o volume antes de testar o backup em uma restauração separada.
