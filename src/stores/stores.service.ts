import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

const STORE_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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
    if (!STORE_SLUG_RE.test(slug)) {
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
}
