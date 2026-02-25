import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

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
}
