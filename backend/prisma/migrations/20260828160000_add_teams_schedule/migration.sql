-- Equipes (louvor, recepção, som...) e escala de voluntários.
-- Só cria estruturas novas.
CREATE TYPE "ScheduleStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED');

CREATE TABLE "MinistryTeam" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MinistryTeam_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "role" TEXT,
    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ScheduleSlot" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "role" TEXT,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    CONSTRAINT "ScheduleSlot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MinistryTeam_churchId_active_idx" ON "MinistryTeam"("churchId", "active");
CREATE UNIQUE INDEX "TeamMember_teamId_memberId_key" ON "TeamMember"("teamId", "memberId");
CREATE INDEX "TeamMember_memberId_idx" ON "TeamMember"("memberId");
CREATE UNIQUE INDEX "ScheduleSlot_teamId_memberId_date_key"
    ON "ScheduleSlot"("teamId", "memberId", "date");
CREATE INDEX "ScheduleSlot_churchId_date_idx" ON "ScheduleSlot"("churchId", "date");
CREATE INDEX "ScheduleSlot_memberId_date_idx" ON "ScheduleSlot"("memberId", "date");

ALTER TABLE "MinistryTeam" ADD CONSTRAINT "MinistryTeam_churchId_fkey"
    FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey"
    FOREIGN KEY ("teamId") REFERENCES "MinistryTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScheduleSlot" ADD CONSTRAINT "ScheduleSlot_teamId_fkey"
    FOREIGN KEY ("teamId") REFERENCES "MinistryTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
