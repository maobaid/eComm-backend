import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

const prismaAddress = (prisma: PrismaService) => (prisma as any).address;
const prismaCustomer = (prisma: PrismaService) => (prisma as any).customer;

export interface AddressRecord {
  id: string;
  store_id: string;
  customer_id: string;
  label: string;
  street: string;
  building_number: string;
  apartment_number: string | null;
  city: string;
  state: string | null;
  postal_code: string | null;
  country: string;
  is_default: boolean;
  created_at: Date;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create an address. If is_default is true, unsets any existing default for
   * this customer (only one default per customer - PROJECT_SPEC).
   */
  async create(
    storeId: string,
    customerId: string,
    data: {
      label: string;
      street: string;
      building_number: string;
      apartment_number?: string | null;
      city: string;
      state?: string | null;
      postal_code?: string | null;
      country: string;
      is_default?: boolean;
    },
  ): Promise<AddressRecord> {
    await this.ensureCustomerInStore(storeId, customerId);

    const isDefault = data.is_default ?? false;

    if (isDefault) {
      return this.prisma.$transaction(async (tx: any) => {
        await tx.address.updateMany({
          where: { customer_id: customerId, store_id: storeId, is_default: true },
          data: { is_default: false },
        });
        const created = await tx.address.create({
          data: {
            store_id: storeId,
            customer_id: customerId,
            label: data.label,
            street: data.street,
            building_number: data.building_number,
            apartment_number: data.apartment_number ?? null,
            city: data.city,
            state: data.state ?? null,
            postal_code: data.postal_code ?? null,
            country: data.country,
            is_default: true,
          },
        });
        return created as AddressRecord;
      });
    }

    const created = await prismaAddress(this.prisma).create({
      data: {
        store_id: storeId,
        customer_id: customerId,
        label: data.label,
        street: data.street,
        building_number: data.building_number,
        apartment_number: data.apartment_number ?? null,
        city: data.city,
        state: data.state ?? null,
        postal_code: data.postal_code ?? null,
        country: data.country,
        is_default: false,
      },
    });
    return created as AddressRecord;
  }

  async findAll(
    storeId: string,
    customerId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResult<AddressRecord>> {
    await this.ensureCustomerInStore(storeId, customerId);

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prismaAddress(this.prisma).findMany({
        where: { store_id: storeId, customer_id: customerId },
        orderBy: [{ is_default: 'desc' }, { created_at: 'desc' }],
        skip,
        take: limit,
      }),
      prismaAddress(this.prisma).count({
        where: { store_id: storeId, customer_id: customerId },
      }),
    ]);

    return {
      data: data as AddressRecord[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(
    storeId: string,
    customerId: string,
    addressId: string,
  ): Promise<AddressRecord> {
    await this.ensureCustomerInStore(storeId, customerId);
    const address = await prismaAddress(this.prisma).findFirst({
      where: {
        id: addressId,
        store_id: storeId,
        customer_id: customerId,
      },
    });
    if (!address) throw new NotFoundException('Address not found');
    return address as AddressRecord;
  }

  /**
   * Update an address. If is_default is set to true, unsets the previous
   * default for this customer (only one default per customer - PROJECT_SPEC).
   */
  async update(
    storeId: string,
    customerId: string,
    addressId: string,
    data: {
      label?: string;
      street?: string;
      building_number?: string;
      apartment_number?: string | null;
      city?: string;
      state?: string | null;
      postal_code?: string | null;
      country?: string;
      is_default?: boolean;
    },
  ): Promise<AddressRecord> {
    await this.findOne(storeId, customerId, addressId);

    const isDefault = data.is_default;

    if (isDefault === true) {
      return this.prisma.$transaction(async (tx: any) => {
        await tx.address.updateMany({
          where: {
            customer_id: customerId,
            store_id: storeId,
            is_default: true,
            id: { not: addressId },
          },
          data: { is_default: false },
        });
        const updated = await tx.address.update({
          where: { id: addressId },
          data: {
            ...(data.label !== undefined && { label: data.label }),
            ...(data.street !== undefined && { street: data.street }),
            ...(data.building_number !== undefined && {
              building_number: data.building_number,
            }),
            ...(data.apartment_number !== undefined && {
              apartment_number: data.apartment_number,
            }),
            ...(data.city !== undefined && { city: data.city }),
            ...(data.state !== undefined && { state: data.state }),
            ...(data.postal_code !== undefined && {
              postal_code: data.postal_code,
            }),
            ...(data.country !== undefined && { country: data.country }),
            is_default: true,
          },
        });
        return updated as AddressRecord;
      });
    }

    const updatePayload: Record<string, unknown> = {};
    if (data.label !== undefined) updatePayload.label = data.label;
    if (data.street !== undefined) updatePayload.street = data.street;
    if (data.building_number !== undefined)
      updatePayload.building_number = data.building_number;
    if (data.apartment_number !== undefined)
      updatePayload.apartment_number = data.apartment_number;
    if (data.city !== undefined) updatePayload.city = data.city;
    if (data.state !== undefined) updatePayload.state = data.state;
    if (data.postal_code !== undefined)
      updatePayload.postal_code = data.postal_code;
    if (data.country !== undefined) updatePayload.country = data.country;
    if (data.is_default === false) updatePayload.is_default = false;

    const updated = await prismaAddress(this.prisma).update({
      where: { id: addressId },
      data: updatePayload,
    });
    return updated as AddressRecord;
  }

  async remove(
    storeId: string,
    customerId: string,
    addressId: string,
  ): Promise<void> {
    await this.findOne(storeId, customerId, addressId);
    await prismaAddress(this.prisma).delete({
      where: { id: addressId },
    });
  }

  /**
   * Ensures the customer exists and belongs to the store (store-scoped access).
   */
  private async ensureCustomerInStore(
    storeId: string,
    customerId: string,
  ): Promise<void> {
    const customer = await prismaCustomer(this.prisma).findFirst({
      where: { id: customerId, store_id: storeId },
    });
    if (!customer)
      throw new NotFoundException('Customer not found in this store');
  }
}
