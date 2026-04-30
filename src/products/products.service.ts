import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { PaginatedResult } from '../common/dto/pagination-query.dto.js';

const product = (p: PrismaService) => (p as any).product;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private withStockFlags<T extends { stock_quantity: number; low_stock_threshold: number }>(
    p: T,
  ): T & { in_stock: boolean; is_low_stock: boolean } {
    return {
      ...p,
      in_stock: p.stock_quantity > 0,
      is_low_stock: p.stock_quantity <= p.low_stock_threshold,
    };
  }

  async create(storeId: string, data: any) {
    const created = await product(this.prisma).create({
      data: {
        store_id: storeId,
        category_id: data.category_id ?? null,
        title: data.title,
        description: data.description ?? null,
        price: data.price,
        image_url: data.image_url ?? null,
        colors: data.colors ?? [],
        sizes: data.sizes ?? [],
        stock_quantity: data.stock_quantity ?? 0,
        low_stock_threshold: data.low_stock_threshold ?? 5,
        is_active: data.is_active ?? true,
      },
    });
    return this.withStockFlags(created);
  }

  async findAll(
    storeId: string,
    page: number = 1,
    limit: number = 20,
    filters?: { lowStockOnly?: boolean; lowStockThreshold?: number },
  ): Promise<PaginatedResult<unknown>> {
    const skip = (page - 1) * limit;
    const threshold = filters?.lowStockThreshold ?? 5;
    const where = filters?.lowStockOnly
      ? {
          store_id: storeId,
          stock_quantity: { lte: threshold },
        }
      : { store_id: storeId };
    const [data, total] = await Promise.all([
      product(this.prisma).findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      product(this.prisma).count({ where }),
    ]);
    return {
      data: data.map((p: any) => this.withStockFlags(p)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(storeId: string, productId: string) {
    const p = await product(this.prisma).findFirst({
      where: { id: productId, store_id: storeId },
    });
    if (!p) throw new NotFoundException('Product not found');
    return this.withStockFlags(p);
  }

  async update(storeId: string, productId: string, data: any) {
    await this.findOne(storeId, productId);
    const payload: any = {};
    if (data.category_id !== undefined) payload.category_id = data.category_id;
    if (data.title != null) payload.title = data.title;
    if (data.description !== undefined) payload.description = data.description;
    if (data.price != null) payload.price = data.price;
    if (data.image_url !== undefined) payload.image_url = data.image_url;
    if (data.colors !== undefined) payload.colors = data.colors;
    if (data.sizes !== undefined) payload.sizes = data.sizes;
    if (data.stock_quantity !== undefined) payload.stock_quantity = data.stock_quantity;
    if (data.low_stock_threshold !== undefined)
      payload.low_stock_threshold = data.low_stock_threshold;
    if (data.is_active !== undefined) payload.is_active = data.is_active;
    const updated = await product(this.prisma).update({ where: { id: productId }, data: payload });
    return this.withStockFlags(updated);
  }

  async remove(storeId: string, productId: string) {
    await this.findOne(storeId, productId);
    await product(this.prisma).delete({ where: { id: productId } });
  }
}
