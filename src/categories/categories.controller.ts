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
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

@ApiTags('Categories')
@Controller('stores/:storeId/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @RequireStoreManager()
  create(
    @ScopedStoreId() storeId: string | undefined,
    @Body() dto: CreateCategoryDto,
  ) {
    console.log('[CategoriesController.create] reached', storeId);
    return this.categoriesService.create(storeId!, {
      name: dto.name,
      slug: dto.slug,
      parent_id: dto.parent_id,
      is_active: dto.is_active,
    });
  }

  @Get()
  findAll(
    @Param('storeId') storeId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.categoriesService.findAll(storeId, query.page, query.limit);
  }

  @Get(':categoryId')
  findOne(
    @Param('storeId') storeId: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ) {
    return this.categoriesService.findOne(storeId, categoryId);
  }

  @Patch(':categoryId')
  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @RequireStoreManager()
  update(
    @ScopedStoreId() storeId: string | undefined,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(storeId!, categoryId, dto);
  }

  @Delete(':categoryId')
  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @RequireStoreManager()
  remove(
    @ScopedStoreId() storeId: string | undefined,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ) {
    return this.categoriesService.remove(storeId!, categoryId);
  }
}
