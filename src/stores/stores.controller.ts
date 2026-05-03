import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { StoreAccessGuard } from '../auth/guards/store-access.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { ScopedStoreId } from '../auth/decorators/scoped-store-id.decorator.js';
import { RequireStoreManager } from '../auth/decorators/require-store-manager.decorator.js';
import { UserRole } from '../auth/constants.js';
import { StoresService } from './stores.service.js';
import { CreateStoreDto } from './dto/create-store.dto.js';
import { UpdateStoreThemeDto } from './dto/update-store-theme.dto.js';

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

  @Get('check-slug/:slug')
  @ApiOperation({
    summary: 'Check if a store slug is available (no auth)',
    description:
      'Use before register-store or create store. Match the same rules on the client (see `slug` + `reason` when unavailable).',
  })
  @ApiOkResponse({
    schema: {
      examples: {
        available: { value: { slug: 'janes-shop', available: true } },
        taken: { value: { slug: 'janes-shop', available: false, reason: 'taken' } },
        invalid: { value: { slug: 'Jane Shop', available: false, reason: 'invalid_format' } },
      },
    },
  })
  checkSlugAvailability(@Param('slug') slug: string) {
    return this.storesService.checkSlugAvailability(slug);
  }

  @Get(':slug/public')
  @ApiOperation({ summary: 'Public store by slug (no auth)' })
  @ApiOkResponse({
    description: 'Public-safe branding fields for an active store',
    schema: {
      example: {
        id: 'uuid',
        name: 'My Store',
        slug: 'my-store',
        store_type: 'PHYSICAL',
        primary_color: '#111111',
        accent_color: '#ff6600',
        logo_url: 'https://example.com/logo.png',
        font_family: 'Inter, system-ui, sans-serif',
      },
    },
  })
  getPublicBySlug(@Param('slug') slug: string) {
    return this.storesService.findPublicBySlug(slug);
  }

  @Patch(':storeId/theme')
  @RequireStoreManager()
  @ApiOperation({
    summary: 'Update store theme (logo, colors, font) only',
    description: 'STORE_ADMIN or SUPER_ADMIN. Omit fields to leave unchanged; empty string clears a nullable field.',
  })
  @ApiBody({ type: UpdateStoreThemeDto })
  @ApiOkResponse({
    description: 'Updated theme fields',
    schema: {
      example: {
        primary_color: '#111111',
        secondary_color: '#222222',
        accent_color: '#ff6600',
        highlight_color: '#ffff00',
        logo_url: 'https://example.com/logo.png',
        font_family: 'Inter, system-ui, sans-serif',
      },
    },
  })
  updateTheme(
    @ScopedStoreId() storeId: string | undefined,
    @Param('storeId', ParseUUIDPipe) _storeId: string,
    @Body() dto: UpdateStoreThemeDto,
  ) {
    return this.storesService.updateTheme(storeId!, dto);
  }

  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @Get(':storeId')
  @ApiOperation({ summary: 'Get store by id' })
  @ApiOkResponse({ description: 'Store', schema: { example: { id: 'uuid', name: 'My Store', slug: 'my-store', is_active: true } } })
  getStore(@Param('storeId') storeId: string) {
    return this.storesService.findOne(storeId);
  }
}
