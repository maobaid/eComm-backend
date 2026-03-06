import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { StoreAccessGuard } from '../auth/guards/store-access.guard.js';
import { ScopedStoreId } from '../auth/decorators/scoped-store-id.decorator.js';
import { RequireStoreManager } from '../auth/decorators/require-store-manager.decorator.js';
import { AddressesService } from './addresses.service.js';
import { CreateAddressDto } from './dto/create-address.dto.js';
import { UpdateAddressDto } from './dto/update-address.dto.js';
import { PaginationQueryDto } from './dto/pagination-query.dto.js';

@ApiTags('Addresses')
@Controller('stores/:storeId/customers/:customerId/addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  @ApiOperation({ summary: 'Create address for customer (public, customer-facing)' })
  @ApiBody({ type: CreateAddressDto })
  @ApiResponse({ status: 201, description: 'Address created' })
  create(
    @Param('storeId') storeId: string,
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Body() dto: CreateAddressDto,
  ) {
    return this.addressesService.create(
      storeId,
      customerId,
      {
        label: dto.label,
        country: dto.country,
        city: dto.city,
        state: dto.state,
        block: dto.block,
        street: dto.street,
        avenue: dto.avenue,
        building_number: dto.building_number,
        apartment_number: dto.apartment_number,
        is_default: dto.is_default,
      },
    );
  }

  @Get()
  @ApiOperation({ summary: 'List addresses for customer (public)' })
  findAll(
    @Param('storeId') storeId: string,
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Query() query: PaginationQueryDto,
  ) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    return this.addressesService.findAll(storeId, customerId, page, limit);
  }

  @Get(':addressId')
  @ApiOperation({ summary: 'Get one address (public)' })
  findOne(
    @Param('storeId') storeId: string,
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
  ) {
    return this.addressesService.findOne(storeId, customerId, addressId);
  }

  @Patch(':addressId')
  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @RequireStoreManager()
  update(
    @ScopedStoreId() storeId: string | undefined,
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressesService.update(storeId!, customerId, addressId, {
      label: dto.label,
      country: dto.country,
      city: dto.city,
      state: dto.state,
      block: dto.block,
      street: dto.street,
      avenue: dto.avenue ?? undefined,
      building_number: dto.building_number,
      apartment_number: dto.apartment_number ?? undefined,
      is_default: dto.is_default,
    });
  }

  @Delete(':addressId')
  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @RequireStoreManager()
  remove(
    @ScopedStoreId() storeId: string | undefined,
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
  ) {
    return this.addressesService.remove(storeId!, customerId, addressId);
  }
}
