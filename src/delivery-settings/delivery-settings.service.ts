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

  async upsert(
    storeId: string,
    data: {
      allow_scheduling?: boolean;
      default_message?: string | null;
      default_country?: string | null;
      allowed_countries?: string | null;
    },
  ) {
    return ds(this.prisma).upsert({
      where: { store_id: storeId },
      create: {
        store_id: storeId,
        allow_scheduling: data.allow_scheduling ?? false,
        default_message: data.default_message ?? null,
        default_country: data.default_country ?? null,
        allowed_countries: data.allowed_countries ?? null,
      },
      update: {
        ...(data.allow_scheduling !== undefined && { allow_scheduling: data.allow_scheduling }),
        ...(data.default_message !== undefined && { default_message: data.default_message }),
        ...(data.default_country !== undefined && { default_country: data.default_country }),
        ...(data.allowed_countries !== undefined && { allowed_countries: data.allowed_countries }),
      },
    });
  }

  /** Public: get address form options (default country, allowed countries) for store. */
  async getAddressOptions(storeId: string) {
    const row = await ds(this.prisma).findUnique({
      where: { store_id: storeId },
      select: { default_country: true, allowed_countries: true },
    });
    const default_country = row?.default_country ?? null;
    let allowed_countries: string[] | null = null;
    if (row?.allowed_countries) {
      try {
        const parsed = JSON.parse(row.allowed_countries) as unknown;
        allowed_countries = Array.isArray(parsed) ? parsed : null;
      } catch {
        allowed_countries = null;
      }
    }
    return { default_country, allowed_countries };
  }
}
