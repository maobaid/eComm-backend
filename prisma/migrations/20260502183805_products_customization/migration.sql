-- CreateEnum
CREATE TYPE "ProductCustomizationKind" AS ENUM ('TEXT', 'IMAGE');

-- CreateEnum
CREATE TYPE "ProductCustomizationTextMode" AS ENUM ('SINGLE_WORD', 'SENTENCE');

-- CreateTable
CREATE TABLE "ProductCustomization" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "kind" "ProductCustomizationKind" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "max_chars" INTEGER,
    "text_mode" "ProductCustomizationTextMode",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductCustomization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItemCustomization" (
    "id" TEXT NOT NULL,
    "order_item_id" TEXT NOT NULL,
    "label_snapshot" TEXT NOT NULL,
    "kind" "ProductCustomizationKind" NOT NULL,
    "text_mode" "ProductCustomizationTextMode",
    "text_value" TEXT,
    "image_url" TEXT,

    CONSTRAINT "OrderItemCustomization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductCustomization_product_id_idx" ON "ProductCustomization"("product_id");

-- CreateIndex
CREATE INDEX "ProductCustomization_product_id_sort_order_idx" ON "ProductCustomization"("product_id", "sort_order");

-- CreateIndex
CREATE INDEX "OrderItemCustomization_order_item_id_idx" ON "OrderItemCustomization"("order_item_id");

-- AddForeignKey
ALTER TABLE "ProductCustomization" ADD CONSTRAINT "ProductCustomization_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItemCustomization" ADD CONSTRAINT "OrderItemCustomization_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
