-- Contas parceladas. Só cria tabelas novas — nenhum lançamento existente é
-- alterado. O saldo só muda quando uma parcela é paga (gera Transaction).
CREATE TABLE "Payable" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "creditor" TEXT,
    "category" TEXT NOT NULL,
    "installments" INTEGER NOT NULL,
    "note" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payable_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PayableInstallment" (
    "id" TEXT NOT NULL,
    "payableId" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "paidAmount" DECIMAL(12,2),
    "transactionId" TEXT,

    CONSTRAINT "PayableInstallment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Payable_churchId_idx" ON "Payable"("churchId");
CREATE UNIQUE INDEX "PayableInstallment_payableId_number_key"
    ON "PayableInstallment"("payableId", "number");
CREATE INDEX "PayableInstallment_churchId_dueDate_idx"
    ON "PayableInstallment"("churchId", "dueDate");
CREATE INDEX "PayableInstallment_churchId_paidAt_idx"
    ON "PayableInstallment"("churchId", "paidAt");

ALTER TABLE "Payable" ADD CONSTRAINT "Payable_churchId_fkey"
    FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PayableInstallment" ADD CONSTRAINT "PayableInstallment_payableId_fkey"
    FOREIGN KEY ("payableId") REFERENCES "Payable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
