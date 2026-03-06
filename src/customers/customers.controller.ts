import {
  BadRequestException,
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
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { CustomersService } from './customers.service.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';
import { UpdateCustomerDto } from './dto/update-customer.dto.js';

@ApiTags('Customers')
@Controller('stores/:storeId/customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @RequireStoreManager()
  @ApiOperation({ summary: 'Create customer' })
  @ApiBody({ type: CreateCustomerDto })
  @ApiResponse({ status: 201, description: 'Customer created', schema: { example: { id: 'uuid', store_id: 'store-uuid', full_name: 'John Doe', phone_number: '+1234567890', email: 'john@example.com', created_at: '2025-02-25T12:00:00.000Z' } } })
  create(
    @ScopedStoreId() storeId: string | undefined,
    @Body() dto: CreateCustomerDto,
  ) {
    return this.customersService.create(storeId!, {
      full_name: dto.full_name,
      phone_number: dto.phone_number,
      email: dto.email,
    });
  }

  @Get('by-phone')
  @ApiOperation({ summary: 'Get customer by phone number (public, OTP verified on frontend)' })
  @ApiOkResponse({ description: 'Customer details', schema: { example: { id: 'uuid', store_id: 'store-uuid', full_name: 'John Doe', phone_number: '+1234567890', email: 'john@example.com', created_at: '2025-02-25T12:00:00.000Z' } } })
  findByPhone(@Param('storeId') storeId: string, @Query('phone') phone: string | undefined) {
    if (!phone || !phone.trim()) throw new BadRequestException('Phone number is required');
    return this.customersService.findByPhone(storeId, phone.trim());
  }

  @Get()
  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @ApiOperation({ summary: 'List customers (paginated)' })
  @ApiOkResponse({ description: 'Paginated list', schema: { example: { data: [], total: 0, page: 1, limit: 20, totalPages: 1 } } })
  findAll(
    @ScopedStoreId() storeId: string | undefined,
    @Query() query: PaginationQueryDto,
  ) {
    return this.customersService.findAll(storeId!, query.page, query.limit);
  }

  @Get(':customerId')
  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  findOne(
    @ScopedStoreId() storeId: string | undefined,
    @Param('customerId', ParseUUIDPipe) customerId: string,
  ) {
    return this.customersService.findOne(storeId!, customerId);
  }

  @Patch(':customerId')
  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @RequireStoreManager()
  update(
    @ScopedStoreId() storeId: string | undefined,
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(storeId!, customerId, {
      full_name: dto.full_name,
      phone_number: dto.phone_number,
      email: dto.email,
    });
  }

  @Delete(':customerId')
  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @RequireStoreManager()
  remove(
    @ScopedStoreId() storeId: string | undefined,
    @Param('customerId', ParseUUIDPipe) customerId: string,
  ) {
    return this.customersService.remove(storeId!, customerId);
  }
}
