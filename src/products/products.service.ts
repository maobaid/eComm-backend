import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { PaginatedResult } from '../common/dto/pagination-query.dto.js';

const product = (p: PrismaService) => (p as any).product;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(storeId: string, data: any) {
    return product(this.prisma).create({
      data: {
        store_id: storeId,
        category_id: data.category_id ?? null,
        title: data.title,
        description: data.description ?? null,
        price: data.price,
        image_url: data.image_url ?? null,
        is_active: data.is_active ?? true,
      },
    });
  }

  async findAll(storeId: string, page: number = 1, limit: number = 20): Promise<PaginatedResult<unknown>> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      product(this.prisma).findMany({
        where: { store_id: storeId },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      product(this.prisma).count({ where: { store_id: storeId } }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  async findOne(storeId: string, productId: string) {
    const p = await product(this.prisma).findFirst({
      where: { id: productId, store_id: storeId },
    });
    if (!p) throw new NotFoundException('Product not found');
    return p;
  }

  async update(storeId: string, productId: string, data: any) {
    await this.findOne(storeId, productId);
    const payload: any = {};
    if (data.category_id !== undefined) payload.category_id = data.category_id;
    if (data.title != null) payload.title = data.title;
    if (data.description !== undefined) payload.description = data.description;
    if (data.price != null) payload.price = data.price;
    if (data.image_url !== undefined) payload.image_url = data.image_url;
    if (data.is_active !== undefined) payload.is_active = data.is_active;
    return product(this.prisma).update({ where: { id: productId }, data: payload });
  }

  async remove(storeId: string, productId: string) {
    await this.findOne(storeId, productId);
    await product(this.prisma).delete({ where: { id: productId } });
  }
}
