#!/bin/sh
set -e

# --- Migrations versionadas (à prova de perda de dados) ---
# Baseline: o banco de produção já tem as tabelas (criadas anteriormente por
# `db push`), mas pode não ter o histórico de migrations. Marcamos a migration
# inicial como APLICADA sem rodar o SQL (não recria tabelas, não apaga nada).
# Idempotente: se já estiver registrada, o erro é ignorado.
npx prisma migrate resolve --applied 0_init 2>/dev/null || true

# Aplica migrations pendentes. `migrate deploy` NUNCA é destrutivo e não usa
# --accept-data-loss; se algo estiver inconsistente, ABORTA (o deploy falha e o
# Railway mantém a versão anterior no ar) em vez de arriscar os dados.
npx prisma migrate deploy

# Sobe a API.
exec node dist/src/main.js
