import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { StoreAccessGuard } from '../auth/guards/store-access.guard.js';
import { StoresService } from './stores.service.js';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  /** Example protected route: JWT + store access (SUPER_ADMIN or own store) */
  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @Get(':storeId')
  getStore(@Param('storeId') _storeId: string) {
    return this.storesService.findOne(_storeId);
  }
}
