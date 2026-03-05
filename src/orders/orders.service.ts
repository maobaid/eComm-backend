import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

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
  constructor(private readonly prisma: PrismaService) {}

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
      items: { product_id: string; quantity: number }[];
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
    });
    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products not found or inactive in this store');
    }
    const productMap = new Map(products.map((p: ProductRow) => [p.id, p]));
    for (const item of body.items) {
      if (item.quantity < 1) throw new BadRequestException('Quantity must be at least 1');
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
      const unitPrice = Number(prod.price);
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
          quantity: l.quantity,
          unit_price: l.unit_price,
          product_discount_applied: l.product_discount_applied,
        })),
      });
      if (couponId) {
        await coupon(txPrisma).update({
          where: { id: couponId },
          data: { usage_count: { increment: 1 } },
        });
      }
      return created;
    });

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

  async updateStatus(storeId: string, orderId: string, status: string) {
    await this.findOne(storeId, orderId);
    return order(this.prisma).update({
      where: { id: orderId },
      data: { status },
    });
  }
}

