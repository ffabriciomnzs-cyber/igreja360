-- Ministério infantil: crianças, responsáveis e check-in/check-out com
-- código de retirada. Só cria estruturas novas.
CREATE TABLE "Child" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "notes" TEXT,
    "restrictions" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Child_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChildGuardian" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "relation" TEXT,
    "memberId" TEXT,
    "canPickup" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "ChildGuardian_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "KidsCheckin" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "room" TEXT,
    "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedInBy" TEXT NOT NULL,
    "checkedInByUserId" TEXT,
    "checkedOutAt" TIMESTAMP(3),
    "checkedOutBy" TEXT,
    "checkedOutByUserId" TEXT,
    CONSTRAINT "KidsCheckin_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Child_churchId_active_idx" ON "Child"("churchId", "active");
CREATE INDEX "ChildGuardian_childId_idx" ON "ChildGuardian"("childId");
CREATE INDEX "KidsCheckin_churchId_day_idx" ON "KidsCheckin"("churchId", "day");
CREATE INDEX "KidsCheckin_childId_idx" ON "KidsCheckin"("childId");

ALTER TABLE "Child" ADD CONSTRAINT "Child_churchId_fkey"
    FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChildGuardian" ADD CONSTRAINT "ChildGuardian_childId_fkey"
    FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KidsCheckin" ADD CONSTRAINT "KidsCheckin_childId_fkey"
    FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;
