/**
 * Testes de integração: sobem a aplicação Nest inteira contra um Postgres real
 * (nada de mock de banco), porque o que precisamos garantir — isolamento entre
 * igrejas, guardas de rota, validação — só aparece de verdade no caminho
 * completo HTTP → guard → serviço → SQL.
 *
 * Requer a variável TEST_DATABASE_URL. Use `npm test` (script test:db) para
 * subir um Postgres descartável automaticamente.
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/test/**/*.e2e-spec.ts'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testTimeout: 30000,
  // Um banco só, compartilhado: os arquivos rodam em série para não brigarem.
  maxWorkers: 1,
};
