import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { PaginatedResult } from '../common/dto/pagination-query.dto.js';

const cat = (p: PrismaService) => (p as any).category;

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    storeId: string,
    data: { name: string; slug: string; parent_id?: string | null; is_active?: boolean },
  ) {
    const existing = await cat(this.prisma).findFirst({
      where: { store_id: storeId, slug: data.slug },
    });
    if (existing) throw new ConflictException('Category slug already exists in this store');
    return cat(this.prisma).create({
      data: {
        store_id: storeId,
        name: data.name,
        slug: data.slug,
        parent_id: data.parent_id ?? null,
        is_active: data.is_active ?? true,
      },
    });
  }

  async findAll(storeId: string, page: number = 1, limit: number = 20): Promise<PaginatedResult<unknown>> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      cat(this.prisma).findMany({
        where: { store_id: storeId },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      cat(this.prisma).count({ where: { store_id: storeId } }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  async findOne(storeId: string, categoryId: string) {
    const c = await cat(this.prisma).findFirst({
      where: { id: categoryId, store_id: storeId },
    });
    if (!c) throw new NotFoundException('Category not found');
    return c;
  }

  async update(
    storeId: string,
    categoryId: string,
    data: { name?: string; slug?: string; parent_id?: string | null; is_active?: boolean },
  ) {
    await this.findOne(storeId, categoryId);
    if (data.slug != null) {
      const existing = await cat(this.prisma).findFirst({
        where: { store_id: storeId, slug: data.slug, id: { not: categoryId } },
      });
      if (existing) throw new ConflictException('Category slug already exists in this store');
    }
    return cat(this.prisma).update({
      where: { id: categoryId },
      data: {
        ...(data.name != null && { name: data.name }),
        ...(data.slug != null && { slug: data.slug }),
        ...(data.parent_id !== undefined && { parent_id: data.parent_id }),
        ...(data.is_active !== undefined && { is_active: data.is_active }),
      },
    });
  }

  async remove(storeId: string, categoryId: string) {
    await this.findOne(storeId, categoryId);
    await cat(this.prisma).delete({ where: { id: categoryId } });
  }
}
