-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "colors" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "low_stock_threshold" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "sizes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "stock_quantity" INTEGER NOT NULL DEFAULT 0;
