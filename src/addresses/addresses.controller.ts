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
@UseGuards(JwtAuthGuard, StoreAccessGuard)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  @ApiOperation({ summary: 'Create address for customer' })
  @ApiBody({ type: CreateAddressDto })
  @ApiResponse({ status: 201, description: 'Address created' })
  create(
    @ScopedStoreId() storeId: string | undefined,
    @Param('storeId') _storeId: string,
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Body() dto: CreateAddressDto,
  ) {
    return this.addressesService.create(
      storeId!,
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
  findAll(
    @ScopedStoreId() storeId: string | undefined,
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.addressesService.findAll(
      storeId!,
      customerId,
      query.page,
      query.limit,
    );
  }

  @Get(':addressId')
  findOne(
    @ScopedStoreId() storeId: string | undefined,
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
  ) {
    return this.addressesService.findOne(storeId!, customerId, addressId);
  }

  @Patch(':addressId')
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
  @RequireStoreManager()
  remove(
    @ScopedStoreId() storeId: string | undefined,
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
  ) {
    return this.addressesService.remove(storeId!, customerId, addressId);
  }
}
