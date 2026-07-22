# Segurança — Igreja360

Este projeto lida com **dados pessoais de membros** (nome, CPF, endereço,
telefone, data de nascimento) e vai passar a lidar com **transações
financeiras**. As decisões abaixo são deliberadas; leia antes de mexer.

## Regras que não se negociam

1. **Toda consulta é escopada por `churchId`.** Acesso por id sempre valida a
   igreja do token (`findFirst({ where: { id, churchId } })`), nunca só o id.
   Um vazamento entre igrejas expõe PII de terceiros e é irreversível.
2. **Endpoints do membro usam o id do JWT**, nunca um id vindo do cliente.
3. **Migrations versionadas.** `prisma migrate deploy` no deploy; nunca
   `db push --accept-data-loss` em produção. O `docker-entrypoint.sh` usa
   `set -e`: se a migration falhar, o container não sobe e o Railway mantém a
   versão anterior no ar.
4. **Nunca commitar segredos.** Credencial que vazou (inclusive em conversa)
   precisa ser rotacionada.
5. **Rate limit no login** (10/min por IP). Ver `src/throttle.config.ts` — os
   padrões são os valores de produção; as variáveis existem só para os testes.

## Testes

`cd backend && npm test` sobe um Postgres descartável, aplica as migrations e
roda a suíte contra a aplicação real (HTTP → guard → serviço → SQL).

O arquivo mais importante é `test/isolamento.e2e-spec.ts`: para cada recurso,
a igreja A cria um registro e a igreja B tenta ler, alterar e apagar pelo id —
tudo tem que dar 404. Ele foi validado por sabotagem: ao remover o `churchId`
de uma consulta, os testes falharam como esperado.

O CI (`.github/workflows/ci.yml`) roda tudo a cada push e pull request. Como o
push na `main` publica automaticamente no Railway, o CI é o último ponto em que
um erro ainda sai barato.

## Vulnerabilidades conhecidas e aceitas

`npm audit` no portal aponta duas dependências **internas do Next.js**:

| Pacote  | Severidade | Por que fica |
|---------|-----------|--------------|
| `sharp` <0.35 | alta | Só é usado pelo `next/image`, que **este projeto não usa em lugar nenhum** (as imagens são `<img>` comuns). O código vulnerável nunca é executado. |
| `postcss` <8.5.10 | moderada | Dependência de **build**, não vai para o navegador. |

Não rode `npm audit fix --force` aqui: ele "resolve" rebaixando o Next da
versão 15 para a **9.3.3**, o que quebraria a aplicação inteira e traria
vulnerabilidades muito piores. A correção certa é atualizar o Next quando
sair uma versão estável com as dependências novas.

Revisar a cada atualização do Next.

## Backups

- **Off-site diário**: `.github/workflows/db-backup.yml` (03:00 BRT), guardado
  como artifact no GitHub por 30 dias, usando o secret `DATABASE_URL`.
- Complementa o backup nativo do Railway.
