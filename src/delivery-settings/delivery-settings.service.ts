import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

const ds = (p: PrismaService) => (p as any).deliverySetting;

@Injectable()
export class DeliverySettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(storeId: string) {
    const s = await ds(this.prisma).findUnique({
      where: { store_id: storeId },
    });
    if (!s) throw new NotFoundException('Delivery setting not found');
    return s;
  }

  async upsert(storeId: string, data: { allow_scheduling?: boolean; default_message?: string | null }) {
    return ds(this.prisma).upsert({
      where: { store_id: storeId },
      create: {
        store_id: storeId,
        allow_scheduling: data.allow_scheduling ?? false,
        default_message: data.default_message ?? null,
      },
      update: {
        ...(data.allow_scheduling !== undefined && { allow_scheduling: data.allow_scheduling }),
        ...(data.default_message !== undefined && { default_message: data.default_message }),
      },
    });
  }
}
