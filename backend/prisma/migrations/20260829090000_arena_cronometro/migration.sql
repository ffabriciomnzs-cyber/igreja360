-- Cronômetro da Arena Bíblica: 30 segundos por pergunta.
-- A hora de abertura fica no servidor porque um relógio de navegador é
-- trivial de burlar (basta pausar o JavaScript e pesquisar a resposta).

ALTER TABLE "ArenaAnswer" ADD COLUMN "timedOut" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "ArenaQuestionOpen" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArenaQuestionOpen_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ArenaQuestionOpen_memberId_day_questionId_key"
    ON "ArenaQuestionOpen"("memberId", "day", "questionId");
CREATE INDEX "ArenaQuestionOpen_churchId_day_idx"
    ON "ArenaQuestionOpen"("churchId", "day");

ALTER TABLE "ArenaQuestionOpen" ADD CONSTRAINT "ArenaQuestionOpen_memberId_fkey"
    FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
