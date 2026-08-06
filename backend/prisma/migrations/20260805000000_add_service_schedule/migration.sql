-- Agenda fixa de cultos (quadro semanal exibido no portal do membro).
-- Só cria tabela nova — nenhum dado existente é alterado.
CREATE TABLE "ServiceSchedule" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "time" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "note" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ServiceSchedule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ServiceSchedule_churchId_active_idx"
    ON "ServiceSchedule"("churchId", "active");

ALTER TABLE "ServiceSchedule" ADD CONSTRAINT "ServiceSchedule_churchId_fkey"
    FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;
