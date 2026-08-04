-- Permite que contas do PAINEL (User) também recebam notificações push,
-- além dos membros do portal. Inscrições existentes continuam válidas:
-- todas têm memberId preenchido e userId nulo.
ALTER TABLE "PushSubscription" ALTER COLUMN "memberId" DROP NOT NULL;
ALTER TABLE "PushSubscription" ADD COLUMN "userId" TEXT;
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");
