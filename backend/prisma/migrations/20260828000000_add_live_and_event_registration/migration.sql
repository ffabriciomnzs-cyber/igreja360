-- Transmissão ao vivo (link do YouTube) + inscrição em eventos.
-- Só acrescenta colunas opcionais e cria uma tabela nova: nenhum dado
-- existente é alterado ou perdido.
ALTER TABLE "Church" ADD COLUMN "liveUrl" TEXT;
ALTER TABLE "Church" ADD COLUMN "liveTitle" TEXT;
ALTER TABLE "Church" ADD COLUMN "liveActive" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Church" ADD COLUMN "liveStartedAt" TIMESTAMP(3);

CREATE TABLE "EventRegistration" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventRegistration_pkey" PRIMARY KEY ("id")
);

-- Uma vaga por pessoa por evento.
CREATE UNIQUE INDEX "EventRegistration_eventId_memberId_key"
    ON "EventRegistration"("eventId", "memberId");
CREATE INDEX "EventRegistration_churchId_eventId_idx"
    ON "EventRegistration"("churchId", "eventId");
CREATE INDEX "EventRegistration_memberId_idx" ON "EventRegistration"("memberId");

ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
