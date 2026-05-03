import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { UpdateStoreThemeDto } from './dto/update-store-theme.dto.js';
import { isValidStoreSlug } from './store-slug.constants.js';

const storeThemeSelect = {
  primary_color: true,
  secondary_color: true,
  accent_color: true,
  highlight_color: true,
  logo_url: true,
  font_family: true,
} satisfies Prisma.StoreSelect;

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { name: string; slug: string; is_active?: boolean }) {
    const existing = await (this.prisma as any).store.findUnique({
      where: { slug: data.slug },
    });
    if (existing) throw new ConflictException('Store slug already taken');
    return (this.prisma as any).store.create({
      data: {
        name: data.name,
        slug: data.slug,
        is_active: data.is_active ?? true,
      },
    });
  }

  async findOne(storeId: string) {
    const store = await (this.prisma as any).store.findUnique({
      where: { id: storeId },
    });
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }

  /** Public storefront: active store only, limited fields. */
  async findPublicBySlug(slug: string) {
    if (!isValidStoreSlug(slug)) {
      throw new BadRequestException('Invalid store slug');
    }
    const store = await this.prisma.store.findFirst({
      where: { slug, is_active: true },
      select: {
        id: true,
        name: true,
        slug: true,
        store_type: true,
        primary_color: true,
        accent_color: true,
        logo_url: true,
        font_family: true,
      },
    });
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }

  /**
   * For registration / admin UI: slug is unique in DB (`Store.slug` @unique).
   * Frontend should mirror {@link isValidStoreSlug} before calling create/register.
   */
  async checkSlugAvailability(slug: string): Promise<{
    slug: string;
    available: boolean;
    reason?: 'invalid_format' | 'taken';
  }> {
    const trimmed = slug.trim();
    if (!isValidStoreSlug(trimmed)) {
      return { slug: trimmed, available: false, reason: 'invalid_format' };
    }
    const existing = await this.prisma.store.findUnique({
      where: { slug: trimmed },
      select: { id: true },
    });
    if (existing) {
      return { slug: trimmed, available: false, reason: 'taken' };
    }
    return { slug: trimmed, available: true };
  }

  async updateTheme(storeId: string, dto: UpdateStoreThemeDto) {
    const exists = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Store not found');

    const data: Prisma.StoreUpdateInput = {};
    const keys = [
      'primary_color',
      'secondary_color',
      'accent_color',
      'highlight_color',
      'logo_url',
      'font_family',
    ] as const;

    for (const key of keys) {
      if (dto[key] === undefined) continue;
      const raw = dto[key] as string;
      data[key] = raw.trim() === '' ? null : raw.trim();
    }

    if (Object.keys(data).length === 0) {
      return this.prisma.store.findUniqueOrThrow({
        where: { id: storeId },
        select: storeThemeSelect,
      });
    }

    return this.prisma.store.update({
      where: { id: storeId },
      data,
      select: storeThemeSelect,
    });
  }
}
