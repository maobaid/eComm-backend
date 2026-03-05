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
import { ProductDiscountsService } from './product-discounts.service.js';
import { CreateProductDiscountDto } from './dto/create-product-discount.dto.js';
import { UpdateProductDiscountDto } from './dto/update-product-discount.dto.js';

@ApiTags('Product Discounts')
@Controller('stores/:storeId/product-discounts')
export class ProductDiscountsController {
  constructor(private readonly productDiscountsService: ProductDiscountsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @RequireStoreManager()
  create(@ScopedStoreId() storeId: string | undefined, @Body() dto: CreateProductDiscountDto) {
    return this.productDiscountsService.create(storeId!, dto);
  }

  @Get()
  findAll(@Param('storeId') storeId: string, @Query() query: PaginationQueryDto) {
    return this.productDiscountsService.findAll(storeId, query.page, query.limit);
  }

  @Get(':discountId')
  findOne(@Param('storeId') storeId: string, @Param('discountId', ParseUUIDPipe) discountId: string) {
    return this.productDiscountsService.findOne(storeId, discountId);
  }

  @Patch(':discountId')
  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @RequireStoreManager()
  update(
    @ScopedStoreId() storeId: string | undefined,
    @Param('discountId', ParseUUIDPipe) discountId: string,
    @Body() dto: UpdateProductDiscountDto,
  ) {
    return this.productDiscountsService.update(storeId!, discountId, dto);
  }

  @Delete(':discountId')
  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @RequireStoreManager()
  remove(
    @ScopedStoreId() storeId: string | undefined,
    @Param('discountId', ParseUUIDPipe) discountId: string,
  ) {
    return this.productDiscountsService.remove(storeId!, discountId);
  }
}
