-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "PortalStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'PASTOR', 'SECRETARY', 'TREASURER', 'LEADER', 'MEMBER');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'VISITOR', 'TRANSFERRED', 'DECEASED');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('DEACON', 'ELDER', 'EVANGELIST', 'PASTOR', 'WORKER', 'MEMBER');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CLOSED');

-- CreateEnum
CREATE TYPE "PrayerStatus" AS ENUM ('ACTIVE', 'ANSWERED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "WorshipStatus" AS ENUM ('PLANNED', 'DONE', 'CANCELED');

-- CreateTable
CREATE TABLE "Church" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "cardLogo" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "site" TEXT,
    "denomination" TEXT,
    "serviceHours" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Church_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
    "gender" "Gender",
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevotionalPrayer" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DevotionalPrayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Devotional" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "title" TEXT,
    "verseRef" TEXT,
    "verseText" TEXT,
    "reflection" TEXT NOT NULL,
    "songTitle" TEXT,
    "songUrl" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Devotional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevotionalCompletion" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DevotionalCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevotionalNote" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DevotionalNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevotionalReaction" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DevotionalReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevotionalPlan" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "cover" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DevotionalPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevotionalPlanDay" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "title" TEXT,
    "verseRef" TEXT,
    "verseText" TEXT,
    "reflection" TEXT NOT NULL,

    CONSTRAINT "DevotionalPlanDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevotionalPlanProgress" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DevotionalPlanProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "cpf" TEXT,
    "birthDate" TIMESTAMP(3),
    "baptismDate" TIMESTAMP(3),
    "address" TEXT,
    "city" TEXT,
    "rg" TEXT,
    "maritalStatus" TEXT,
    "profession" TEXT,
    "photo" TEXT,
    "passwordHash" TEXT,
    "portalStatus" "PortalStatus" NOT NULL DEFAULT 'NONE',
    "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "role" "MemberRole",
    "cellId" TEXT,
    "joinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cell" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "leaderId" TEXT,
    "coLeaderId" TEXT,
    "dayOfWeek" TEXT,
    "time" TEXT,
    "address" TEXT,
    "neighborhood" TEXT,
    "capacity" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cell_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CellMeeting" (
    "id" TEXT NOT NULL,
    "cellId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "theme" TEXT,
    "attendees" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CellMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "location" TEXT,
    "capacity" INTEGER,
    "type" TEXT,
    "photo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'ACTIVE',
    "goal" DECIMAL(12,2),
    "current" DECIMAL(12,2),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Communication" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'NOTICE',
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Communication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prayer" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "memberId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "PrayerStatus" NOT NULL DEFAULT 'ACTIVE',
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorshipService" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "theme" TEXT,
    "bibleRef" TEXT,
    "notes" TEXT,
    "status" "WorshipStatus" NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorshipService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorshipItem" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "responsible" TEXT,
    "durationMin" INTEGER,
    "notes" TEXT,

    CONSTRAINT "WorshipItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorshipParticipant" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "memberId" TEXT,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "WorshipParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Church_slug_key" ON "Church"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_churchId_idx" ON "User"("churchId");

-- CreateIndex
CREATE INDEX "DevotionalPrayer_churchId_day_idx" ON "DevotionalPrayer"("churchId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "DevotionalPrayer_memberId_day_key" ON "DevotionalPrayer"("memberId", "day");

-- CreateIndex
CREATE INDEX "Devotional_churchId_idx" ON "Devotional"("churchId");

-- CreateIndex
CREATE UNIQUE INDEX "Devotional_churchId_date_key" ON "Devotional"("churchId", "date");

-- CreateIndex
CREATE INDEX "DevotionalCompletion_churchId_day_idx" ON "DevotionalCompletion"("churchId", "day");

-- CreateIndex
CREATE INDEX "DevotionalCompletion_memberId_idx" ON "DevotionalCompletion"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "DevotionalCompletion_memberId_day_key" ON "DevotionalCompletion"("memberId", "day");

-- CreateIndex
CREATE INDEX "DevotionalNote_memberId_idx" ON "DevotionalNote"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "DevotionalNote_memberId_day_key" ON "DevotionalNote"("memberId", "day");

-- CreateIndex
CREATE INDEX "DevotionalReaction_churchId_day_idx" ON "DevotionalReaction"("churchId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "DevotionalReaction_memberId_day_key" ON "DevotionalReaction"("memberId", "day");

-- CreateIndex
CREATE INDEX "DevotionalPlan_churchId_idx" ON "DevotionalPlan"("churchId");

-- CreateIndex
CREATE INDEX "DevotionalPlanDay_planId_idx" ON "DevotionalPlanDay"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "DevotionalPlanDay_planId_dayNumber_key" ON "DevotionalPlanDay"("planId", "dayNumber");

-- CreateIndex
CREATE INDEX "DevotionalPlanProgress_memberId_planId_idx" ON "DevotionalPlanProgress"("memberId", "planId");

-- CreateIndex
CREATE UNIQUE INDEX "DevotionalPlanProgress_memberId_planId_dayNumber_key" ON "DevotionalPlanProgress"("memberId", "planId", "dayNumber");

-- CreateIndex
CREATE INDEX "Member_churchId_idx" ON "Member"("churchId");

-- CreateIndex
CREATE INDEX "Member_cellId_idx" ON "Member"("cellId");

-- CreateIndex
CREATE INDEX "Cell_churchId_idx" ON "Cell"("churchId");

-- CreateIndex
CREATE INDEX "CellMeeting_cellId_idx" ON "CellMeeting"("cellId");

-- CreateIndex
CREATE INDEX "Transaction_churchId_idx" ON "Transaction"("churchId");

-- CreateIndex
CREATE INDEX "Transaction_date_idx" ON "Transaction"("date");

-- CreateIndex
CREATE INDEX "Event_churchId_idx" ON "Event"("churchId");

-- CreateIndex
CREATE INDEX "Campaign_churchId_idx" ON "Campaign"("churchId");

-- CreateIndex
CREATE INDEX "Communication_churchId_idx" ON "Communication"("churchId");

-- CreateIndex
CREATE INDEX "Prayer_churchId_idx" ON "Prayer"("churchId");

-- CreateIndex
CREATE INDEX "WorshipService_churchId_idx" ON "WorshipService"("churchId");

-- CreateIndex
CREATE INDEX "WorshipService_date_idx" ON "WorshipService"("date");

-- CreateIndex
CREATE INDEX "WorshipItem_serviceId_idx" ON "WorshipItem"("serviceId");

-- CreateIndex
CREATE INDEX "WorshipParticipant_serviceId_idx" ON "WorshipParticipant"("serviceId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevotionalPlanDay" ADD CONSTRAINT "DevotionalPlanDay_planId_fkey" FOREIGN KEY ("planId") REFERENCES "DevotionalPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_cellId_fkey" FOREIGN KEY ("cellId") REFERENCES "Cell"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cell" ADD CONSTRAINT "Cell_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CellMeeting" ADD CONSTRAINT "CellMeeting_cellId_fkey" FOREIGN KEY ("cellId") REFERENCES "Cell"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prayer" ADD CONSTRAINT "Prayer_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorshipService" ADD CONSTRAINT "WorshipService_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorshipItem" ADD CONSTRAINT "WorshipItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "WorshipService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorshipParticipant" ADD CONSTRAINT "WorshipParticipant_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "WorshipService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

