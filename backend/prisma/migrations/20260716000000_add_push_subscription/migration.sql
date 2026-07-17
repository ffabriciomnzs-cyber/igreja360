-- CreateTable: inscrições de notificação push dos membros
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
CREATE INDEX "PushSubscription_churchId_idx" ON "PushSubscription"("churchId");
CREATE INDEX "PushSubscription_memberId_idx" ON "PushSubscription"("memberId");
