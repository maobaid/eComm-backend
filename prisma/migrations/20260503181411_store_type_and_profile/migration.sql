-- CreateEnum
CREATE TYPE "StoreType" AS ENUM ('PHYSICAL', 'DIGITAL', 'APPOINTMENT');

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "accent_color" TEXT,
ADD COLUMN     "font_family" TEXT,
ADD COLUMN     "logo_url" TEXT,
ADD COLUMN     "primary_color" TEXT,
ADD COLUMN     "secondary_color" TEXT,
ADD COLUMN     "store_type" "StoreType" NOT NULL DEFAULT 'PHYSICAL';
