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
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { StoreAccessGuard } from '../auth/guards/store-access.guard.js';
import { ScopedStoreId } from '../auth/decorators/scoped-store-id.decorator.js';
import { RequireStoreManager } from '../auth/decorators/require-store-manager.decorator.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { CouponsService } from './coupons.service.js';
import { CreateCouponDto } from './dto/create-coupon.dto.js';
import { UpdateCouponDto } from './dto/update-coupon.dto.js';

@ApiTags('Coupons')
@Controller('stores/:storeId/coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @RequireStoreManager()
  create(@ScopedStoreId() storeId: string | undefined, @Body() dto: CreateCouponDto) {
    return this.couponsService.create(storeId!, dto);
  }

  @Get()
  findAll(@Param('storeId') storeId: string, @Query() query: PaginationQueryDto) {
    return this.couponsService.findAll(storeId, query.page, query.limit);
  }

  @Get(':couponId')
  findOne(@Param('storeId') storeId: string, @Param('couponId', ParseUUIDPipe) couponId: string) {
    return this.couponsService.findOne(storeId, couponId);
  }

  @Patch(':couponId')
  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @RequireStoreManager()
  update(
    @ScopedStoreId() storeId: string | undefined,
    @Param('couponId', ParseUUIDPipe) couponId: string,
    @Body() dto: UpdateCouponDto,
  ) {
    return this.couponsService.update(storeId!, couponId, dto);
  }

  @Delete(':couponId')
  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @RequireStoreManager()
  remove(
    @ScopedStoreId() storeId: string | undefined,
    @Param('couponId', ParseUUIDPipe) couponId: string,
  ) {
    return this.couponsService.remove(storeId!, couponId);
  }
}
