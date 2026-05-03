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
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ProductsQueryDto } from './dto/products-query.dto.js';
import { BestSellersQueryDto } from './dto/best-sellers-query.dto.js';

@ApiTags('Products')
@Controller('stores/:storeId/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @RequireStoreManager()
  create(@ScopedStoreId() storeId: string | undefined, @Body() dto: CreateProductDto) {
    return this.productsService.create(storeId!, dto);
  }

  @Get()
  findAll(@Param('storeId') storeId: string, @Query() query: ProductsQueryDto) {
    return this.productsService.findAll(storeId, query.page, query.limit, {
      lowStockOnly: query.low_stock_only,
      lowStockThreshold: query.low_stock_threshold,
    });
  }

  @Get('best-sellers')
  @ApiOperation({
    summary: 'Best-selling active products by units sold (non-cancelled orders only)',
    description:
      'Optional `days` limits to orders placed in the last N days (rolling window). Omits inactive products.',
  })
  findBestSellers(@Param('storeId') storeId: string, @Query() query: BestSellersQueryDto) {
    return this.productsService.findBestSellers(storeId, query.limit, {
      days: query.days,
    });
  }

  @Get(':productId')
  findOne(@Param('storeId') storeId: string, @Param('productId', ParseUUIDPipe) productId: string) {
    return this.productsService.findOne(storeId, productId);
  }

  @Patch(':productId')
  @RequireStoreManager()
  update(
    @ScopedStoreId() storeId: string | undefined,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(storeId!, productId, dto);
  }

  @Delete(':productId')
  @RequireStoreManager()
  remove(
    @ScopedStoreId() storeId: string | undefined,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.productsService.remove(storeId!, productId);
  }
}
