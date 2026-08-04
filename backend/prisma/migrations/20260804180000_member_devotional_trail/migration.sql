-- Trilhas temáticas do devocional: guarda qual trilha o membro segue e em que
-- dia ele está. Só cria tabela nova — nenhum dado existente é alterado.
CREATE TABLE "MemberDevotionalTrail" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "trailId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "lastDay" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberDevotionalTrail_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MemberDevotionalTrail_memberId_key"
    ON "MemberDevotionalTrail"("memberId");
CREATE INDEX "MemberDevotionalTrail_churchId_idx"
    ON "MemberDevotionalTrail"("churchId");
