-- Arena Bíblica: respostas do desafio diário. Só cria tabela nova —
-- nenhum dado existente é alterado.
CREATE TABLE "ArenaAnswer" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "choice" INTEGER NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "points" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArenaAnswer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ArenaAnswer_memberId_day_questionId_key"
    ON "ArenaAnswer"("memberId", "day", "questionId");
CREATE INDEX "ArenaAnswer_churchId_day_idx" ON "ArenaAnswer"("churchId", "day");
CREATE INDEX "ArenaAnswer_churchId_memberId_idx" ON "ArenaAnswer"("churchId", "memberId");

ALTER TABLE "ArenaAnswer" ADD CONSTRAINT "ArenaAnswer_memberId_fkey"
    FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
