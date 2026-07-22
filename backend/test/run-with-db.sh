#!/bin/sh
# Sobe um Postgres descartável, aplica as migrations e roda os testes.
# Uso: npm test
#
# Se TEST_DATABASE_URL já vier definida (ex.: no CI, que tem seu próprio
# Postgres), usa esse banco e não sobe nada.
set -e

cd "$(dirname "$0")/.."

if [ -n "$TEST_DATABASE_URL" ]; then
  echo "→ Usando banco de teste já configurado."
  npx prisma migrate deploy >/dev/null
  exec npx jest "$@"
fi

# Encontra o Postgres (Homebrew não o coloca no PATH por padrão).
if ! command -v pg_ctl >/dev/null 2>&1; then
  for d in /opt/homebrew/opt/postgresql@*/bin /usr/local/opt/postgresql@*/bin; do
    [ -x "$d/pg_ctl" ] && PATH="$d:$PATH" && break
  done
fi
if ! command -v pg_ctl >/dev/null 2>&1; then
  echo "✗ Postgres não encontrado. Instale com: brew install postgresql@16"
  exit 1
fi

PGPORT=55433
PGDIR="${TMPDIR:-/tmp}/igreja360-testdb-$$"
# LC_ALL=C evita o erro "postmaster tornou-se multithread" no macOS.
export LC_ALL=C

limpar() {
  pg_ctl -D "$PGDIR" stop -m immediate >/dev/null 2>&1 || true
  rm -rf "$PGDIR"
}
trap limpar EXIT INT TERM

echo "→ Subindo Postgres de teste na porta $PGPORT..."
initdb -D "$PGDIR" -U postgres >/dev/null 2>&1
# -k /tmp: o caminho do socket tem limite de ~100 caracteres.
pg_ctl -D "$PGDIR" \
  -o "-k /tmp -p $PGPORT -c listen_addresses=127.0.0.1" \
  -l "$PGDIR/postgres.log" start >/dev/null

# Espera o banco aceitar conexão (o start retorna antes de estar pronto).
i=0
until pg_isready -h 127.0.0.1 -p $PGPORT -q 2>/dev/null; do
  i=$((i + 1))
  [ $i -gt 30 ] && echo "✗ Postgres não respondeu." && exit 1
  sleep 1
done

createdb -h 127.0.0.1 -p $PGPORT -U postgres igreja360_test

export TEST_DATABASE_URL="postgresql://postgres@127.0.0.1:$PGPORT/igreja360_test"
export DATABASE_URL="$TEST_DATABASE_URL"

echo "→ Aplicando migrations..."
npx prisma migrate deploy >/dev/null

echo "→ Rodando os testes..."
npx jest "$@"
