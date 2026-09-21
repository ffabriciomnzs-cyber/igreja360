-- AlterTable
ALTER TABLE "ArenaDuel" ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "declinedAt" TIMESTAMP(3),
ADD COLUMN     "inviteSentAt" TIMESTAMP(3),
ADD COLUMN     "resultSentAt" TIMESTAMP(3);
