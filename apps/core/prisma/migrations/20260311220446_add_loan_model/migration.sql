-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('PENDING', 'DISBURSED', 'REPAID', 'DEFAULTED');

-- CreateTable
CREATE TABLE "loans" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "receiver" TEXT NOT NULL,
    "milestoneIndex" INTEGER,
    "status" "LoanStatus" NOT NULL DEFAULT 'PENDING',
    "disbursedAt" TIMESTAMP(3),
    "repaidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
