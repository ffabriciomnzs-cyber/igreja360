-- "Estou orando" nos pedidos do mural. Só cria tabela nova — nenhum dado
-- existente é alterado.
CREATE TABLE "PrayerIntercession" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "prayerId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrayerIntercession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PrayerIntercession_prayerId_memberId_key"
    ON "PrayerIntercession"("prayerId", "memberId");
CREATE INDEX "PrayerIntercession_churchId_idx" ON "PrayerIntercession"("churchId");

ALTER TABLE "PrayerIntercession" ADD CONSTRAINT "PrayerIntercession_prayerId_fkey"
    FOREIGN KEY ("prayerId") REFERENCES "Prayer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
