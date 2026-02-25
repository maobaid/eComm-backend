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
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';

@ApiTags('Products')
@Controller('stores/:storeId/products')
@UseGuards(JwtAuthGuard, StoreAccessGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @RequireStoreManager()
  create(@ScopedStoreId() storeId: string | undefined, @Body() dto: CreateProductDto) {
    return this.productsService.create(storeId!, dto);
  }

  @Get()
  findAll(@ScopedStoreId() storeId: string | undefined, @Query() query: PaginationQueryDto) {
    return this.productsService.findAll(storeId!, query.page, query.limit);
  }

  @Get(':productId')
  findOne(
    @ScopedStoreId() storeId: string | undefined,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.productsService.findOne(storeId!, productId);
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
