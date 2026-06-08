-- AlterTable
ALTER TABLE "FinancialAccount" ADD COLUMN     "externalId" TEXT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "externalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "FinancialAccount_userId_externalId_key" ON "FinancialAccount"("userId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_userId_externalId_key" ON "Transaction"("userId", "externalId");
