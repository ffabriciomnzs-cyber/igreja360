-- CreateTable
CREATE TABLE "ArenaSeason" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "startDay" TEXT NOT NULL,
    "endDay" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArenaSeason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArenaThemePoll" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "startDay" TEXT NOT NULL,
    "endDay" TEXT NOT NULL,
    "options" TEXT[],
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "winner" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArenaThemePoll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArenaThemeVote" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArenaThemeVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArenaDuel" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "challengerId" TEXT NOT NULL,
    "opponentId" TEXT,
    "questionIds" TEXT[],
    "token" TEXT NOT NULL,
    "rematchOfId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArenaDuel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArenaRoundTurn" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "duelId" TEXT,
    "flashId" TEXT,
    "memberId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "choice" INTEGER,
    "correct" BOOLEAN,
    "answeredAt" TIMESTAMP(3),

    CONSTRAINT "ArenaRoundTurn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArenaFlash" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "windowMin" INTEGER NOT NULL DEFAULT 10,
    "questions" INTEGER NOT NULL DEFAULT 5,
    "bonus" INTEGER NOT NULL DEFAULT 5,
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArenaFlash_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArenaMission" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "target" INTEGER NOT NULL,
    "startDay" TEXT NOT NULL,
    "endDay" TEXT NOT NULL,
    "reward" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArenaMission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArenaSeason_churchId_idx" ON "ArenaSeason"("churchId");

-- CreateIndex
CREATE UNIQUE INDEX "ArenaSeason_churchId_startDay_key" ON "ArenaSeason"("churchId", "startDay");

-- CreateIndex
CREATE INDEX "ArenaThemePoll_churchId_idx" ON "ArenaThemePoll"("churchId");

-- CreateIndex
CREATE UNIQUE INDEX "ArenaThemePoll_churchId_startDay_key" ON "ArenaThemePoll"("churchId", "startDay");

-- CreateIndex
CREATE INDEX "ArenaThemeVote_churchId_idx" ON "ArenaThemeVote"("churchId");

-- CreateIndex
CREATE UNIQUE INDEX "ArenaThemeVote_pollId_memberId_key" ON "ArenaThemeVote"("pollId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "ArenaDuel_token_key" ON "ArenaDuel"("token");

-- CreateIndex
CREATE INDEX "ArenaDuel_churchId_idx" ON "ArenaDuel"("churchId");

-- CreateIndex
CREATE INDEX "ArenaDuel_challengerId_idx" ON "ArenaDuel"("challengerId");

-- CreateIndex
CREATE INDEX "ArenaDuel_opponentId_idx" ON "ArenaDuel"("opponentId");

-- CreateIndex
CREATE INDEX "ArenaRoundTurn_churchId_idx" ON "ArenaRoundTurn"("churchId");

-- CreateIndex
CREATE UNIQUE INDEX "ArenaRoundTurn_duelId_memberId_questionId_key" ON "ArenaRoundTurn"("duelId", "memberId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "ArenaRoundTurn_flashId_memberId_questionId_key" ON "ArenaRoundTurn"("flashId", "memberId", "questionId");

-- CreateIndex
CREATE INDEX "ArenaFlash_churchId_startsAt_idx" ON "ArenaFlash"("churchId", "startsAt");

-- CreateIndex
CREATE INDEX "ArenaMission_churchId_startDay_idx" ON "ArenaMission"("churchId", "startDay");

-- AddForeignKey
ALTER TABLE "ArenaSeason" ADD CONSTRAINT "ArenaSeason_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArenaThemePoll" ADD CONSTRAINT "ArenaThemePoll_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArenaThemeVote" ADD CONSTRAINT "ArenaThemeVote_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "ArenaThemePoll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArenaThemeVote" ADD CONSTRAINT "ArenaThemeVote_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArenaDuel" ADD CONSTRAINT "ArenaDuel_challengerId_fkey" FOREIGN KEY ("challengerId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArenaDuel" ADD CONSTRAINT "ArenaDuel_opponentId_fkey" FOREIGN KEY ("opponentId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArenaRoundTurn" ADD CONSTRAINT "ArenaRoundTurn_duelId_fkey" FOREIGN KEY ("duelId") REFERENCES "ArenaDuel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArenaRoundTurn" ADD CONSTRAINT "ArenaRoundTurn_flashId_fkey" FOREIGN KEY ("flashId") REFERENCES "ArenaFlash"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArenaRoundTurn" ADD CONSTRAINT "ArenaRoundTurn_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArenaFlash" ADD CONSTRAINT "ArenaFlash_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArenaMission" ADD CONSTRAINT "ArenaMission_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;
