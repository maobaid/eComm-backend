import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { StoreAccessGuard } from '../auth/guards/store-access.guard.js';
import { ScopedStoreId } from '../auth/decorators/scoped-store-id.decorator.js';
import { RequireStoreManager } from '../auth/decorators/require-store-manager.decorator.js';
import { DeliverySettingsService } from './delivery-settings.service.js';
import { UpsertDeliverySettingDto } from './dto/upsert-delivery-setting.dto.js';

@ApiTags('Delivery Settings')
@Controller('stores/:storeId/delivery-settings')
@UseGuards(JwtAuthGuard, StoreAccessGuard)
export class DeliverySettingsController {
  constructor(private readonly deliverySettingsService: DeliverySettingsService) {}

  @Get()
  findOne(@ScopedStoreId() storeId: string | undefined) {
    return this.deliverySettingsService.findOne(storeId!);
  }

  @Put()
  @RequireStoreManager()
  @ApiOperation({ summary: 'Create or update delivery settings' })
  @ApiBody({ type: UpsertDeliverySettingDto })
  upsert(@ScopedStoreId() storeId: string | undefined, @Body() dto: UpsertDeliverySettingDto) {
    return this.deliverySettingsService.upsert(storeId!, dto);
  }
}
