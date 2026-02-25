import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { PaginatedResult } from '../common/dto/pagination-query.dto.js';

const coupon = (p: PrismaService) => (p as any).coupon;

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(storeId: string, data: any) {
    const existing = await coupon(this.prisma).findFirst({
      where: { store_id: storeId, code: data.code },
    });
    if (existing) throw new ConflictException('Coupon code already exists in this store');
    return coupon(this.prisma).create({
      data: {
        store_id: storeId,
        code: data.code,
        type: data.type,
        value: data.value,
        minimum_order_amount: data.minimum_order_amount ?? null,
        expires_at: new Date(data.expires_at),
        usage_limit: data.usage_limit ?? null,
        is_active: data.is_active ?? true,
      },
    });
  }

  async findAll(storeId: string, page = 1, limit = 20): Promise<PaginatedResult<unknown>> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      coupon(this.prisma).findMany({
        where: { store_id: storeId },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      coupon(this.prisma).count({ where: { store_id: storeId } }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  async findOne(storeId: string, couponId: string) {
    const c = await coupon(this.prisma).findFirst({
      where: { id: couponId, store_id: storeId },
    });
    if (!c) throw new NotFoundException('Coupon not found');
    return c;
  }

  async update(storeId: string, couponId: string, data: any) {
    await this.findOne(storeId, couponId);
    if (data.code != null) {
      const ex = await coupon(this.prisma).findFirst({
        where: { store_id: storeId, code: data.code, id: { not: couponId } },
      });
      if (ex) throw new ConflictException('Coupon code already exists in this store');
    }
    const payload: Record<string, unknown> = {};
    if (data.code != null) payload.code = data.code;
    if (data.type != null) payload.type = data.type;
    if (data.value != null) payload.value = data.value;
    if (data.minimum_order_amount !== undefined) payload.minimum_order_amount = data.minimum_order_amount;
    if (data.expires_at != null) payload.expires_at = new Date(data.expires_at);
    if (data.usage_limit !== undefined) payload.usage_limit = data.usage_limit;
    if (data.is_active !== undefined) payload.is_active = data.is_active;
    return coupon(this.prisma).update({ where: { id: couponId }, data: payload });
  }

  async remove(storeId: string, couponId: string) {
    await this.findOne(storeId, couponId);
    await coupon(this.prisma).delete({ where: { id: couponId } });
  }
}
