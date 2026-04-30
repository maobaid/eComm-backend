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

      const tableStartX = doc.x;
      const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const colWidths = {
        item: tableWidth * 0.4,
        qty: tableWidth * 0.1,
        unit: tableWidth * 0.16,
        discount: tableWidth * 0.16,
        total: tableWidth * 0.18,
      };
      const rowHeight = 22;
      let currentY = doc.y;

      const drawRowBorders = (y: number) => {
        doc
          .lineWidth(0.8)
          .rect(tableStartX, y, tableWidth, rowHeight)
          .stroke();
        let x = tableStartX + colWidths.item;
        doc.moveTo(x, y).lineTo(x, y + rowHeight).stroke();
        x += colWidths.qty;
        doc.moveTo(x, y).lineTo(x, y + rowHeight).stroke();
        x += colWidths.unit;
        doc.moveTo(x, y).lineTo(x, y + rowHeight).stroke();
        x += colWidths.discount;
        doc.moveTo(x, y).lineTo(x, y + rowHeight).stroke();
      };

      const drawHeader = () => {
        drawRowBorders(currentY);
        const pad = 5;
        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .text('Item', tableStartX + pad, currentY + 7, { width: colWidths.item - pad * 2 })
          .text('Qty', tableStartX + colWidths.item + pad, currentY + 7, {
            width: colWidths.qty - pad * 2,
            align: 'right',
          })
          .text('Unit', tableStartX + colWidths.item + colWidths.qty + pad, currentY + 7, {
            width: colWidths.unit - pad * 2,
            align: 'right',
          })
          .text(
            'Discount',
            tableStartX + colWidths.item + colWidths.qty + colWidths.unit + pad,
            currentY + 7,
            {
              width: colWidths.discount - pad * 2,
              align: 'right',
            },
          )
          .text(
            'Line Total',
            tableStartX + colWidths.item + colWidths.qty + colWidths.unit + colWidths.discount + pad,
            currentY + 7,
            {
              width: colWidths.total - pad * 2,
              align: 'right',
            },
          );
        currentY += rowHeight;
      };

      drawHeader();

      order.items.forEach((item) => {
        if (currentY + rowHeight > doc.page.height - doc.page.margins.bottom - 90) {
          doc.addPage();
          currentY = doc.page.margins.top;
          drawHeader();
        }

        const qty = item.quantity;
        const unitPrice = Number(item.unit_price);
        const discount = Number(item.product_discount_applied);
        const lineTotal = qty * unitPrice - discount;

        drawRowBorders(currentY);
        const pad = 5;
        doc
          .fontSize(9)
          .font('Helvetica')
          .text(item.product.title, tableStartX + pad, currentY + 7, {
            width: colWidths.item - pad * 2,
            ellipsis: true,
          })
          .text(String(qty), tableStartX + colWidths.item + pad, currentY + 7, {
            width: colWidths.qty - pad * 2,
            align: 'right',
          })
          .text(unitPrice.toFixed(2), tableStartX + colWidths.item + colWidths.qty + pad, currentY + 7, {
            width: colWidths.unit - pad * 2,
            align: 'right',
          })
          .text(
            discount.toFixed(2),
            tableStartX + colWidths.item + colWidths.qty + colWidths.unit + pad,
            currentY + 7,
            {
              width: colWidths.discount - pad * 2,
              align: 'right',
            },
          )
          .text(
            lineTotal.toFixed(2),
            tableStartX + colWidths.item + colWidths.qty + colWidths.unit + colWidths.discount + pad,
            currentY + 7,
            {
              width: colWidths.total - pad * 2,
              align: 'right',
            },
          );
        currentY += rowHeight;
      });

      doc.y = currentY + 14;
      if (order.coupon?.code) doc.text(`Coupon: ${order.coupon.code}`);
      doc.text(`Product discounts: ${formatMoney(order.total_product_discount_amount)}`);
      doc.text(`Coupon discount: ${formatMoney(order.total_coupon_discount_amount)}`);
      doc.fontSize(12).text(`Total: ${formatMoney(order.total_amount)}`, { underline: true });
      doc.end();
    });
  }
}
