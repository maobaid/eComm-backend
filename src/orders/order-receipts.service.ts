import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import PDFDocument from 'pdfkit';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

type ReceiptOrderData = {
  id: string;
  store: { name: string };
  customer: { full_name: string; phone_number: string; email: string | null };
  address: {
    label: string;
    country: string;
    city: string;
    state: string;
    block: string;
    street: string;
    avenue: string | null;
    building_number: string;
    apartment_number: string | null;
  };
  coupon: { code: string } | null;
  items: Array<{
    quantity: number;
    unit_price: unknown;
    product_discount_applied: unknown;
    product: { title: string };
  }>;
  total_amount: unknown;
  total_product_discount_amount: unknown;
  total_coupon_discount_amount: unknown;
  created_at: Date;
};

@Injectable()
export class OrderReceiptsService {
  private readonly logger = new Logger(OrderReceiptsService.name);

  constructor(private readonly configService: ConfigService) {}

  async createReceiptPdf(order: ReceiptOrderData): Promise<{
    filePath: string;
    fileName: string;
    sizeBytes: number;
    buffer: Buffer;
  }> {
    const buffer = await this.generatePdfBuffer(order);
    const receiptsDir = path.resolve(
      this.configService.get<string>('ORDER_RECEIPTS_DIR') ?? './storage/receipts',
    );
    await mkdir(receiptsDir, { recursive: true });

    const fileName = `receipt-${order.id}-${Date.now()}.pdf`;
    const filePath = path.join(receiptsDir, fileName);
    await writeFile(filePath, buffer);
    this.logger.log(`Receipt saved: ${filePath}`);

    return { filePath, fileName, sizeBytes: buffer.byteLength, buffer };
  }

  private generatePdfBuffer(order: ReceiptOrderData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      doc.on('error', reject);
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      const formatMoney = (value: unknown) => Number(value ?? 0).toFixed(2);

      doc.fontSize(20).text('Order Receipt', { align: 'center' });
      doc.moveDown();
      doc.fontSize(11).text(`Store: ${order.store.name}`);
      doc.text(`Order ID: ${order.id}`);
      doc.text(`Order Date: ${new Date(order.created_at).toISOString()}`);
      doc.moveDown();
      doc.text(`Customer: ${order.customer.full_name}`);
      doc.text(`Phone: ${order.customer.phone_number}`);
      if (order.customer.email) doc.text(`Email: ${order.customer.email}`);
      doc.moveDown();

      const address = [
        order.address.label,
        `${order.address.country}, ${order.address.city}, ${order.address.state}`,
        `Block ${order.address.block}, Street ${order.address.street}`,
        order.address.avenue ? `Avenue ${order.address.avenue}` : null,
        `Building ${order.address.building_number}`,
        order.address.apartment_number ? `Apartment ${order.address.apartment_number}` : null,
      ]
        .filter(Boolean)
        .join(' | ');
      doc.text(`Delivery Address: ${address}`);
      doc.moveDown();

      doc.fontSize(12).text('Items', { underline: true });
      doc.moveDown(0.5);
      order.items.forEach((item, index) => {
        const qty = item.quantity;
        const unitPrice = Number(item.unit_price);
        const discount = Number(item.product_discount_applied);
        const lineTotal = qty * unitPrice - discount;
        doc
          .fontSize(10)
          .text(
            `${index + 1}. ${item.product.title} | qty: ${qty} | unit: ${unitPrice.toFixed(2)} | discount: ${discount.toFixed(2)} | line total: ${lineTotal.toFixed(2)}`,
          );
      });

      doc.moveDown();
      if (order.coupon?.code) doc.text(`Coupon: ${order.coupon.code}`);
      doc.text(`Product discounts: ${formatMoney(order.total_product_discount_amount)}`);
      doc.text(`Coupon discount: ${formatMoney(order.total_coupon_discount_amount)}`);
      doc.fontSize(12).text(`Total: ${formatMoney(order.total_amount)}`, { underline: true });
      doc.end();
    });
  }
}
