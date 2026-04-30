import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { PaginatedResult } from '../common/dto/pagination-query.dto.js';

const product = (p: PrismaService) => (p as any).product;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private deriveOptionListsFromVariants(variants: any[]): { colors: string[]; sizes: string[] } {
    const colors = [...new Set(variants.map((v: any) => v.color).filter(Boolean))] as string[];
    const sizes = [...new Set(variants.map((v: any) => v.size).filter(Boolean))] as string[];
    return { colors, sizes };
  }

  private sumVariantStocks(variants: any[]): number {
    return variants.reduce((sum: number, v: any) => sum + Number(v.stock_quantity ?? 0), 0);
  }

  /** When a product has variants, `product.stock_quantity` is kept equal to Σ variant stocks. */
  private async syncProductStockFromVariantsIfNeeded(productId: string): Promise<void> {
    const row = await product(this.prisma).findUnique({
      where: { id: productId },
      select: { variants: { select: { stock_quantity: true } } },
    });
    const vs = row?.variants ?? [];
    if (!vs.length) return;
    const sum = this.sumVariantStocks(vs as any[]);
    await product(this.prisma).update({
      where: { id: productId },
      data: { stock_quantity: sum },
    });
  }

  private withStockFlags<
    T extends { stock_quantity: number; low_stock_threshold: number; variants?: any[] },
  >(p: T): T & { in_stock: boolean; is_low_stock: boolean } {
    const hasVariants = Array.isArray(p.variants) && p.variants.length > 0;
    if (hasVariants) {
      const { colors, sizes } = this.deriveOptionListsFromVariants(p.variants!);
      const variantStockTotal = p.variants!.reduce(
        (sum: number, v: any) => sum + Number(v.stock_quantity || 0),
        0,
      );
      const variantThresholdMax = Math.max(
        ...p.variants!.map((v: any) => Number(v.low_stock_threshold ?? 0)),
        0,
      );
      return {
        ...p,
        colors,
        sizes,
        in_stock: variantStockTotal > 0,
        is_low_stock: variantStockTotal <= variantThresholdMax,
      };
    }
    return {
      ...p,
      in_stock: p.stock_quantity > 0,
      is_low_stock: p.stock_quantity <= p.low_stock_threshold,
    };
  }

  async create(storeId: string, data: any) {
    const variants = Array.isArray(data.variants) ? data.variants : [];
    const { colors: colorsFromVariants, sizes: sizesFromVariants } =
      variants.length > 0
        ? this.deriveOptionListsFromVariants(variants)
        : { colors: [], sizes: [] };

    const stockFromVariantsSum = variants.length > 0 ? this.sumVariantStocks(variants) : null;

    const created = await product(this.prisma).create({
      data: {
        store_id: storeId,
        category_id: data.category_id ?? null,
        title: data.title,
        description: data.description ?? null,
        price: data.price,
        image_url: data.image_url ?? null,
        colors: variants.length > 0 ? colorsFromVariants : (data.colors ?? []),
        sizes: variants.length > 0 ? sizesFromVariants : (data.sizes ?? []),
        stock_quantity: stockFromVariantsSum ?? data.stock_quantity ?? 0,
        low_stock_threshold: data.low_stock_threshold ?? 5,
        is_active: data.is_active ?? true,
        variants: variants.length
          ? {
              create: variants.map((v: any) => ({
                color: v.color ?? null,
                size: v.size ?? null,
                price_override: v.price_override ?? null,
                stock_quantity: v.stock_quantity ?? 0,
                low_stock_threshold: v.low_stock_threshold ?? 2,
                is_active: v.is_active ?? true,
              })),
            }
          : undefined,
      },
      include: { variants: true },
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
        include: { variants: true },
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
      include: { variants: true },
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
    if (data.low_stock_threshold !== undefined)
      payload.low_stock_threshold = data.low_stock_threshold;
    if (data.is_active !== undefined) payload.is_active = data.is_active;

    if (data.variants !== undefined) {
      const list = data.variants || [];
      payload.variants = {
        deleteMany: {},
        create: list.map((v: any) => ({
          color: v.color ?? null,
          size: v.size ?? null,
          price_override: v.price_override ?? null,
          stock_quantity: v.stock_quantity ?? 0,
          low_stock_threshold: v.low_stock_threshold ?? 2,
          is_active: v.is_active ?? true,
        })),
      };
      if (list.length > 0) {
        const derived = this.deriveOptionListsFromVariants(list);
        payload.colors = derived.colors;
        payload.sizes = derived.sizes;
        payload.stock_quantity = this.sumVariantStocks(list);
      } else {
        payload.colors = [];
        payload.sizes = [];
        if (data.stock_quantity !== undefined) payload.stock_quantity = data.stock_quantity;
      }
    } else if (data.stock_quantity !== undefined) {
      payload.stock_quantity = data.stock_quantity;
    }

    await product(this.prisma).update({
      where: { id: productId },
      data: payload,
    });

    await this.syncProductStockFromVariantsIfNeeded(productId);

    const refreshed = await product(this.prisma).findFirst({
      where: { id: productId, store_id: storeId },
      include: { variants: true },
    });
    return this.withStockFlags(refreshed);
  }

  async remove(storeId: string, productId: string) {
    await this.findOne(storeId, productId);
    await product(this.prisma).delete({ where: { id: productId } });
  }
}
