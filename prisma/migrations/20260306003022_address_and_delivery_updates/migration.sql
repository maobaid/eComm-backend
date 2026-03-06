/*
  Warnings:

  - You are about to drop the column `postal_code` on the `Address` table. All the data in the column will be lost.
  - Added the required column `block` to the `Address` table without a default value. This is not possible if the table is not empty.
  - Made the column `state` on table `Address` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Address" DROP COLUMN "postal_code",
ADD COLUMN     "avenue" TEXT,
ADD COLUMN     "block" TEXT NOT NULL,
ALTER COLUMN "state" SET NOT NULL;

-- AlterTable
ALTER TABLE "DeliverySetting" ADD COLUMN     "allowed_countries" TEXT,
ADD COLUMN     "default_country" TEXT;
