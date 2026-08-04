-- "Esqueci minha senha" do portal: pedido criado na tela de entrada e
-- resolvido pela secretaria no painel. Só cria tabela nova — nenhum dado
-- existente é alterado.
CREATE TABLE "PasswordResetRequest" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "PasswordResetRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PasswordResetRequest_churchId_status_idx"
    ON "PasswordResetRequest"("churchId", "status");
CREATE INDEX "PasswordResetRequest_memberId_status_idx"
    ON "PasswordResetRequest"("memberId", "status");

ALTER TABLE "PasswordResetRequest" ADD CONSTRAINT "PasswordResetRequest_memberId_fkey"
    FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
