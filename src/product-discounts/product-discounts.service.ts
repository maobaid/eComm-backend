import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { PaginatedResult } from '../common/dto/pagination-query.dto.js';

const pd = (p: PrismaService) => (p as any).productDiscount;
const pdi = (p: PrismaService) => (p as any).productDiscountItem;

@Injectable()
export class ProductDiscountsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(storeId: string, data: any) {
    const productIds = data.product_ids ?? [];
    if (data.applies_to === 'SPECIFIC_PRODUCTS' && productIds.length === 0) {
      throw new BadRequestException('product_ids required when applies_to is SPECIFIC_PRODUCTS');
    }
    const created = await pd(this.prisma).create({
      data: {
        store_id: storeId,
        name: data.name,
        percentage: data.percentage,
        applies_to: data.applies_to,
        category_id: data.category_id ?? null,
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date),
        is_active: data.is_active ?? true,
      },
    });
    if (productIds.length > 0) {
      await pdi(this.prisma).createMany({
        data: productIds.map((pid: string) => ({ product_discount_id: created.id, product_id: pid })),
      });
    }
    return created;
  }

  async findAll(storeId: string, page = 1, limit = 20): Promise<PaginatedResult<unknown>> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      pd(this.prisma).findMany({
        where: { store_id: storeId },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        include: { items: true },
      }),
      pd(this.prisma).count({ where: { store_id: storeId } }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  async findOne(storeId: string, discountId: string) {
    const d = await pd(this.prisma).findFirst({
      where: { id: discountId, store_id: storeId },
      include: { items: true },
    });
    if (!d) throw new NotFoundException('Product discount not found');
    return d;
  }

  async update(storeId: string, discountId: string, data: any) {
    await this.findOne(storeId, discountId);
    await pd(this.prisma).update({
      where: { id: discountId },
      data: {
        ...(data.name != null && { name: data.name }),
        ...(data.percentage != null && { percentage: data.percentage }),
        ...(data.applies_to != null && { applies_to: data.applies_to }),
        ...(data.category_id !== undefined && { category_id: data.category_id }),
        ...(data.start_date != null && { start_date: new Date(data.start_date) }),
        ...(data.end_date != null && { end_date: new Date(data.end_date) }),
        ...(data.is_active !== undefined && { is_active: data.is_active }),
      },
    });
    if (data.product_ids !== undefined) {
      await pdi(this.prisma).deleteMany({ where: { product_discount_id: discountId } });
      if (Array.isArray(data.product_ids) && data.product_ids.length > 0) {
        await pdi(this.prisma).createMany({
          data: data.product_ids.map((pid: string) => ({ product_discount_id: discountId, product_id: pid })),
        });
      }
    }
    return this.findOne(storeId, discountId);
  }

  async remove(storeId: string, discountId: string) {
    await this.findOne(storeId, discountId);
    await pd(this.prisma).delete({ where: { id: discountId } });
  }
}
