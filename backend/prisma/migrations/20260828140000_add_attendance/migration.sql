-- Presença no culto (check-in do membro + marcação manual pelo painel).
-- Só cria tabela nova.
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "worshipId" TEXT,
    "day" TEXT NOT NULL,
    "markedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- Uma presença por membro por dia: dois toques não contam duas vezes.
CREATE UNIQUE INDEX "Attendance_memberId_day_key" ON "Attendance"("memberId", "day");
CREATE INDEX "Attendance_churchId_day_idx" ON "Attendance"("churchId", "day");
CREATE INDEX "Attendance_memberId_idx" ON "Attendance"("memberId");

ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_churchId_fkey"
    FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;
