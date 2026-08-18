-- Recados de aniversário entre membros. Só cria tabela nova — nenhum dado
-- existente é alterado.
CREATE TABLE "BirthdayGreeting" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BirthdayGreeting_pkey" PRIMARY KEY ("id")
);

-- Um recado por pessoa, por aniversariante, por ano: reenviar edita o texto
-- em vez de encher a tela de repetição.
CREATE UNIQUE INDEX "BirthdayGreeting_memberId_authorId_year_key"
    ON "BirthdayGreeting"("memberId", "authorId", "year");
CREATE INDEX "BirthdayGreeting_churchId_memberId_year_idx"
    ON "BirthdayGreeting"("churchId", "memberId", "year");

ALTER TABLE "BirthdayGreeting" ADD CONSTRAINT "BirthdayGreeting_churchId_fkey"
    FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;
