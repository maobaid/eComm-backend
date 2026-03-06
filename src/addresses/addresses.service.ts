import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

const prismaAddress = (prisma: PrismaService) => (prisma as any).address;
const prismaCustomer = (prisma: PrismaService) => (prisma as any).customer;

export interface AddressRecord {
  id: string;
  store_id: string;
  customer_id: string;
  label: string;
  country: string;
  city: string;
  state: string;
  block: string;
  street: string;
  avenue: string | null;
  building_number: string;
  apartment_number: string | null;
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
      country: string;
      city: string;
      state: string;
      block: string;
      street: string;
      avenue?: string | null;
      building_number: string;
      apartment_number?: string | null;
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
            country: data.country,
            city: data.city,
            state: data.state,
            block: data.block,
            street: data.street,
            avenue: data.avenue ?? null,
            building_number: data.building_number,
            apartment_number: data.apartment_number ?? null,
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
        country: data.country,
        city: data.city,
        state: data.state,
        block: data.block,
        street: data.street,
        avenue: data.avenue ?? null,
        building_number: data.building_number,
        apartment_number: data.apartment_number ?? null,
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
      country?: string;
      city?: string;
      state?: string;
      block?: string;
      street?: string;
      avenue?: string | null;
      building_number?: string;
      apartment_number?: string | null;
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
            ...(data.country !== undefined && { country: data.country }),
            ...(data.city !== undefined && { city: data.city }),
            ...(data.state !== undefined && { state: data.state }),
            ...(data.block !== undefined && { block: data.block }),
            ...(data.street !== undefined && { street: data.street }),
            ...(data.avenue !== undefined && { avenue: data.avenue }),
            ...(data.building_number !== undefined && {
              building_number: data.building_number,
            }),
            ...(data.apartment_number !== undefined && {
              apartment_number: data.apartment_number,
            }),
            is_default: true,
          },
        });
        return updated as AddressRecord;
      });
    }

    const updatePayload: Record<string, unknown> = {};
    if (data.label !== undefined) updatePayload.label = data.label;
    if (data.country !== undefined) updatePayload.country = data.country;
    if (data.city !== undefined) updatePayload.city = data.city;
    if (data.state !== undefined) updatePayload.state = data.state;
    if (data.block !== undefined) updatePayload.block = data.block;
    if (data.street !== undefined) updatePayload.street = data.street;
    if (data.avenue !== undefined) updatePayload.avenue = data.avenue;
    if (data.building_number !== undefined)
      updatePayload.building_number = data.building_number;
    if (data.apartment_number !== undefined)
      updatePayload.apartment_number = data.apartment_number;
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
