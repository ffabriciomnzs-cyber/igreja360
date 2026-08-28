-- Visitantes que se cadastram sozinhos pelo QR code do culto, e o
-- acompanhamento até virarem membros. Só cria estruturas novas.
CREATE TYPE "VisitorStatus" AS ENUM ('NEW', 'CONTACTED', 'RETURNED', 'MEMBER', 'ARCHIVED');

CREATE TABLE "Visitor" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "birthDate" TIMESTAMP(3),
    "city" TEXT,
    "howFound" TEXT,
    "invitedBy" TEXT,
    "prayerRequest" TEXT,
    "wantsVisit" BOOLEAN NOT NULL DEFAULT false,
    "status" "VisitorStatus" NOT NULL DEFAULT 'NEW',
    "memberId" TEXT,
    "firstVisitAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Visitor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VisitorFollowUp" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitorFollowUp_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Visitor_churchId_status_idx" ON "Visitor"("churchId", "status");
CREATE INDEX "Visitor_churchId_createdAt_idx" ON "Visitor"("churchId", "createdAt");
CREATE INDEX "VisitorFollowUp_visitorId_idx" ON "VisitorFollowUp"("visitorId");

ALTER TABLE "Visitor" ADD CONSTRAINT "Visitor_churchId_fkey"
    FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VisitorFollowUp" ADD CONSTRAINT "VisitorFollowUp_visitorId_fkey"
    FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
