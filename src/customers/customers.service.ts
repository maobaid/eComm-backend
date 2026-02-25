import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { PaginatedResult } from '../common/dto/pagination-query.dto.js';

const db = (p: PrismaService) => (p as any).customer;

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    storeId: string,
    data: { full_name: string; phone_number: string; email?: string | null },
  ) {
    const existing = await db(this.prisma).findFirst({
      where: { store_id: storeId, phone_number: data.phone_number },
    });
    if (existing) throw new ConflictException('Customer with this phone number already exists in this store');
    return db(this.prisma).create({
      data: {
        store_id: storeId,
        full_name: data.full_name,
        phone_number: data.phone_number,
        email: data.email ?? null,
      },
    });
  }

  async findAll(storeId: string, page: number = 1, limit: number = 20): Promise<PaginatedResult<unknown>> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      db(this.prisma).findMany({
        where: { store_id: storeId },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      db(this.prisma).count({ where: { store_id: storeId } }),
    ]);
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(storeId: string, customerId: string) {
    const c = await db(this.prisma).findFirst({
      where: { id: customerId, store_id: storeId },
    });
    if (!c) throw new NotFoundException('Customer not found');
    return c;
  }

  async update(
    storeId: string,
    customerId: string,
    data: { full_name?: string; phone_number?: string; email?: string | null },
  ) {
    await this.findOne(storeId, customerId);
    if (data.phone_number != null) {
      const existing = await db(this.prisma).findFirst({
        where: { store_id: storeId, phone_number: data.phone_number, id: { not: customerId } },
      });
      if (existing) throw new ConflictException('Customer with this phone number already exists in this store');
    }
    return db(this.prisma).update({
      where: { id: customerId },
      data: {
        ...(data.full_name != null && { full_name: data.full_name }),
        ...(data.phone_number != null && { phone_number: data.phone_number }),
        ...(data.email !== undefined && { email: data.email }),
      },
    });
  }

  async remove(storeId: string, customerId: string) {
    await this.findOne(storeId, customerId);
    await db(this.prisma).delete({ where: { id: customerId } });
  }
}
