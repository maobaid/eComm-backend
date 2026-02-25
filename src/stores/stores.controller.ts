import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { StoreAccessGuard } from '../auth/guards/store-access.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/constants.js';
import { StoresService } from './stores.service.js';
import { CreateStoreDto } from './dto/create-store.dto.js';

@ApiTags('Stores')
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a store (SUPER_ADMIN only)' })
  @ApiBody({ type: CreateStoreDto })
  @ApiResponse({ status: 201, description: 'Store created', schema: { example: { id: 'uuid', name: 'My Store', slug: 'my-store', is_active: true, created_at: '2025-02-25T12:00:00.000Z' } } })
  @ApiResponse({ status: 409, description: 'Store slug already taken' })
  create(@Body() dto: CreateStoreDto) {
    return this.storesService.create({
      name: dto.name,
      slug: dto.slug,
      is_active: dto.is_active,
    });
  }

  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @Get(':storeId')
  @ApiOperation({ summary: 'Get store by id' })
  @ApiOkResponse({ description: 'Store', schema: { example: { id: 'uuid', name: 'My Store', slug: 'my-store', is_active: true } } })
  getStore(@Param('storeId') storeId: string) {
    return this.storesService.findOne(storeId);
  }
}
