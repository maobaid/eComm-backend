import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { createReadStream } from 'node:fs';
import { access } from 'node:fs/promises';
import { OrderReceiptsService } from './order-receipts.service.js';
import { OrderWhatsappService } from './order-whatsapp.service.js';

const store = (p: any) => p.store;
const customer = (p: any) => p.customer;
const address = (p: any) => p.address;
const product = (p: any) => p.product;
const order = (p: any) => p.order;
const orderItem = (p: any) => p.orderItem;
const coupon = (p: any) => p.coupon;
const productDiscount = (p: any) => p.productDiscount;
const productDiscountItem = (p: any) => p.productDiscountItem;

interface ProductRow {
  id: string;
  price: unknown;
  category_id: string | null;
  stock_quantity: number;
  variants?: Array<{
    id: string;
    stock_quantity: number;
    price_override: unknown;
    is_active: boolean;
  }>;
}

const APPLIES_TO = {
  ALL_PRODUCTS: 'ALL_PRODUCTS',
  CATEGORY: 'CATEGORY',
  SPECIFIC_PRODUCTS: 'SPECIFIC_PRODUCTS',
} as const;

const COUPON_TYPE = { PERCENTAGE: 'PERCENTAGE', FIXED: 'FIXED' } as const;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly orderReceiptsService: OrderReceiptsService,
    private readonly orderWhatsappService: OrderWhatsappService,
  ) {}

  /**
   * Create order in a Prisma transaction. Applies product discounts first,
   * then coupon only if store.allow_discount_stacking is true. Never trusts
   * client-side prices (ARCHITECTURE_RULES).
   */
  async create(
    storeId: string,
    body: {
      customer_id: string;
      address_id: string;
      items: { product_id: string; quantity: number; product_variant_id?: string }[];
      coupon_code?: string;
      scheduled_delivery?: string;
    },
  ) {
    const now = new Date();

    const storeRecord = await store(this.prisma).findUnique({
      where: { id: storeId },
    });
    if (!storeRecord) throw new NotFoundException('Store not found');
    const allowDiscountStacking = !!storeRecord.allow_discount_stacking;

    const [customerRecord, addressRecord] = await Promise.all([
      customer(this.prisma).findFirst({
        where: { id: body.customer_id, store_id: storeId },
      }),
      address(this.prisma).findFirst({
        where: {
          id: body.address_id,
          store_id: storeId,
          customer_id: body.customer_id,
        },
      }),
    ]);
    if (!customerRecord) throw new NotFoundException('Customer not found in this store');
    if (!addressRecord) throw new NotFoundException('Address not found for this customer');

    const productIds = [...new Set(body.items.map((i) => i.product_id))];
    const products = await product(this.prisma).findMany({
      where: { id: { in: productIds }, store_id: storeId, is_active: true },
      include: {
        variants: {
          where: { is_active: true },
          select: { id: true, stock_quantity: true, price_override: true, is_active: true },
        },
      },
    });
    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products not found or inactive in this store');
    }
    const productMap = new Map(products.map((p: ProductRow) => [p.id, p]));
    for (const item of body.items) {
      if (item.quantity < 1) throw new BadRequestException('Quantity must be at least 1');
      const prod = productMap.get(item.product_id) as ProductRow | undefined;
      if (!prod) throw new BadRequestException('Product not found');
      if (item.product_variant_id) {
        const variant = (prod.variants || []).find((v) => v.id === item.product_variant_id);
        if (!variant) {
          throw new BadRequestException(
            `Variant ${item.product_variant_id} does not belong to product ${item.product_id}`,
          );
        }
        if (item.quantity > variant.stock_quantity) {
          throw new BadRequestException(
            `Insufficient stock for variant ${item.product_variant_id}. Available: ${variant.stock_quantity}`,
          );
        }
      } else if ((prod.variants || []).length > 0) {
        throw new BadRequestException(
          `product_variant_id is required for product ${item.product_id} because it has variants`,
        );
      } else if (item.quantity > prod.stock_quantity) {
        throw new BadRequestException(
          `Insufficient stock for product ${item.product_id}. Available: ${prod.stock_quantity}`,
        );
      }
    }

    const activeProductDiscounts = await productDiscount(this.prisma).findMany({
      where: {
        store_id: storeId,
        is_active: true,
        start_date: { lte: now },
        end_date: { gte: now },
      },
      include: { items: true },
    });

    const lineInputs = body.items.map((item) => {
      const prod = productMap.get(item.product_id) as ProductRow | undefined;
      if (!prod) throw new BadRequestException('Product not found');
      const selectedVariant = item.product_variant_id
        ? (prod.variants || []).find((v) => v.id === item.product_variant_id)
        : null;
      const unitPrice = Number(selectedVariant?.price_override ?? prod.price);
      const qty = item.quantity;
      const lineSubtotal = round2(unitPrice * qty);
      let bestPct = 0;
      for (const d of activeProductDiscounts) {
        let applies = false;
        if (d.applies_to === APPLIES_TO.ALL_PRODUCTS) applies = true;
        else if (d.applies_to === APPLIES_TO.CATEGORY && d.category_id && prod.category_id === d.category_id)
          applies = true;
        else if (d.applies_to === APPLIES_TO.SPECIFIC_PRODUCTS && d.items?.some((i: any) => i.product_id === prod.id))
          applies = true;
        if (applies) bestPct = Math.max(bestPct, Number(d.percentage));
      }
      const productDiscountApplied = round2(lineSubtotal * (bestPct / 100));
      return {
        product_id: prod.id,
        product_variant_id: item.product_variant_id ?? null,
        quantity: qty,
        unit_price: unitPrice,
        product_discount_applied: productDiscountApplied,
      };
    });

    const totalProductDiscountAmount = round2(
      lineInputs.reduce((s, l) => s + l.product_discount_applied, 0),
    );
    const subtotalAfterProductDiscounts = round2(
      lineInputs.reduce((s, l) => s + l.quantity * l.unit_price - l.product_discount_applied, 0),
    );

    let couponId: string | null = null;
    let totalCouponDiscountAmount = 0;

    if (body.coupon_code && body.coupon_code.trim()) {
      if (!allowDiscountStacking) {
        if (totalProductDiscountAmount > 0) {
          body.coupon_code = undefined;
        }
        totalCouponDiscountAmount = 0;
      } else {
        const couponRecord = await coupon(this.prisma).findFirst({
          where: {
            store_id: storeId,
            code: body.coupon_code.trim(),
            is_active: true,
            expires_at: { gte: now },
          },
        });
        if (couponRecord) {
          const limitOk = couponRecord.usage_limit == null || couponRecord.usage_count < couponRecord.usage_limit;
          const minOk =
            couponRecord.minimum_order_amount == null ||
            Number(couponRecord.minimum_order_amount) <= subtotalAfterProductDiscounts;
          if (limitOk && minOk) {
            couponId = couponRecord.id;
            const val = Number(couponRecord.value);
            if (couponRecord.type === COUPON_TYPE.PERCENTAGE) {
              totalCouponDiscountAmount = round2(subtotalAfterProductDiscounts * (val / 100));
            } else {
              totalCouponDiscountAmount = Math.min(val, subtotalAfterProductDiscounts);
              totalCouponDiscountAmount = round2(totalCouponDiscountAmount);
            }
          }
        }
      }
    }

    const totalAmount = round2(subtotalAfterProductDiscounts - totalCouponDiscountAmount);
    if (totalAmount < 0) throw new BadRequestException('Invalid discount combination');

    const scheduledDelivery = body.scheduled_delivery
      ? new Date(body.scheduled_delivery)
      : null;

    const result = await this.prisma.$transaction(async (txPrisma: any) => {
      const created = await order(txPrisma).create({
        data: {
          store_id: storeId,
          customer_id: body.customer_id,
          address_id: body.address_id,
          coupon_id: couponId,
          total_amount: totalAmount,
          total_product_discount_amount: totalProductDiscountAmount,
          total_coupon_discount_amount: totalCouponDiscountAmount,
          status: 'PENDING',
          scheduled_delivery: scheduledDelivery,
        },
      });
      await orderItem(txPrisma).createMany({
        data: lineInputs.map((l) => ({
          order_id: created.id,
          product_id: l.product_id,
          product_variant_id: l.product_variant_id,
          quantity: l.quantity,
          unit_price: l.unit_price,
          product_discount_applied: l.product_discount_applied,
        })),
      });
      for (const l of lineInputs) {
        if (l.product_variant_id) {
          const updatedVariant = await (txPrisma as any).productVariant.updateMany({
            where: {
              id: l.product_variant_id,
              product_id: l.product_id,
              stock_quantity: { gte: l.quantity },
              is_active: true,
            },
            data: { stock_quantity: { decrement: l.quantity } },
          });
          if (updatedVariant.count !== 1) {
            throw new BadRequestException(`Insufficient stock for variant ${l.product_variant_id}`);
          }
        } else {
          const updated = await product(txPrisma).updateMany({
            where: {
              id: l.product_id,
              store_id: storeId,
              stock_quantity: { gte: l.quantity },
            },
            data: { stock_quantity: { decrement: l.quantity } },
          });
          if (updated.count !== 1) {
            throw new BadRequestException(`Insufficient stock for product ${l.product_id}`);
          }
        }
      }
      const productIdsTouched = [...new Set(lineInputs.map((l: { product_id: string }) => l.product_id))];
      for (const pid of productIdsTouched) {
        await this.reconcileProductAggregateStockInTx(txPrisma, pid);
      }
      if (couponId) {
        await coupon(txPrisma).update({
          where: { id: couponId },
          data: { usage_count: { increment: 1 } },
        });
      }
      return created;
    });

    await this.createAndSendReceiptSafe(storeId, result.id);
    return result;
  }

  async findAll(storeId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      order(this.prisma).findMany({
        where: { store_id: storeId },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        include: { items: true },
      }),
      order(this.prisma).count({ where: { store_id: storeId } }),
    ]);
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(storeId: string, orderId: string) {
    const o = await order(this.prisma).findFirst({
      where: { id: orderId, store_id: storeId },
      include: { items: true, customer: true, address: true, coupon: true },
    });
    if (!o) throw new NotFoundException('Order not found');
    return o;
  }

  async getLatestReceipt(storeId: string, orderId: string) {
    await this.findOne(storeId, orderId);
    const latest = await this.prisma.orderReceipt.findFirst({
      where: { store_id: storeId, order_id: orderId },
      orderBy: { created_at: 'desc' },
    });
    if (!latest) throw new NotFoundException('Receipt not found for this order');
    try {
      await access(latest.file_path);
    } catch {
      throw new NotFoundException('Receipt file not found in storage');
    }

    return {
      stream: createReadStream(latest.file_path),
      fileName: latest.file_name,
      mimeType: latest.mime_type,
    };
  }

  async resendReceipt(storeId: string, orderId: string) {
    await this.findOne(storeId, orderId);
    const receiptRecord = await this.createAndSendReceiptSafe(storeId, orderId, true);
    if (!receiptRecord) {
      throw new InternalServerErrorException('Failed to generate/send receipt');
    }
    return receiptRecord;
  }

  async updateStatus(storeId: string, orderId: string, status: string) {
    await this.findOne(storeId, orderId);
    return order(this.prisma).update({
      where: { id: orderId },
      data: { status },
    });
  }

  /** When variants exist, `product.stock_quantity` must equal Σ variant stocks (handles orders that only decrement variants). */
  private async reconcileProductAggregateStockInTx(txPrisma: any, productId: string): Promise<void> {
    const variants = await (txPrisma as any).productVariant.findMany({
      where: { product_id: productId },
      select: { stock_quantity: true },
    });
    if (!variants.length) return;
    const sum = variants.reduce(
      (acc: number, v: { stock_quantity: unknown }) => acc + Number(v.stock_quantity ?? 0),
      0,
    );
    await product(txPrisma).update({
      where: { id: productId },
      data: { stock_quantity: sum },
    });
  }

  private async createAndSendReceiptSafe(storeId: string, orderId: string, throwOnError = false) {
    try {
      return await this.createAndSendReceipt(storeId, orderId);
    } catch (error) {
      if (throwOnError) throw error;
      return null;
    }
  }

  private async createAndSendReceipt(storeId: string, orderId: string) {
    const orderWithDetails = await order(this.prisma).findFirst({
      where: { id: orderId, store_id: storeId },
      include: {
        store: { select: { name: true } },
        customer: { select: { full_name: true, phone_number: true, email: true } },
        address: true,
        coupon: { select: { code: true } },
        items: {
          include: {
            product: { select: { title: true } },
          },
        },
      },
    });
    if (!orderWithDetails) throw new NotFoundException('Order not found');

    const receiptPdf = await this.orderReceiptsService.createReceiptPdf(orderWithDetails as any);
    const publicBaseUrl = this.configService.get<string>('ORDER_RECEIPTS_PUBLIC_BASE_URL');
    if (!publicBaseUrl) {
      throw new Error('Missing ORDER_RECEIPTS_PUBLIC_BASE_URL for WhatsApp document URL');
    }
    const mediaUrl = `${publicBaseUrl.replace(/\/$/, '')}/${encodeURIComponent(receiptPdf.fileName)}`;

    let status: 'SENT' | 'FAILED' = 'SENT';
    let errorText: string | null = null;
    let messageId: string | null = null;
    try {
      const sent = await this.orderWhatsappService.sendReceipt({
        toPhoneNumber: orderWithDetails.customer.phone_number,
        mediaUrl,
        caption: `Receipt for order ${orderWithDetails.id}`,
      });
      messageId = sent.messageId;
    } catch (error) {
      status = 'FAILED';
      errorText = error instanceof Error ? error.message : 'Unknown WhatsApp error';
    }

    return this.prisma.orderReceipt.create({
      data: {
        order_id: orderWithDetails.id,
        store_id: orderWithDetails.store_id,
        file_path: receiptPdf.filePath,
        file_name: receiptPdf.fileName,
        mime_type: 'application/pdf',
        size_bytes: receiptPdf.sizeBytes,
        whatsapp_phone: orderWithDetails.customer.phone_number,
        whatsapp_status: status,
        whatsapp_message_id: messageId,
        send_attempts: 1,
        last_error: errorText,
        sent_at: status === 'SENT' ? new Date() : null,
      },
    });
  }
}

