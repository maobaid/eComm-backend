import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { StoreAccessGuard } from '../auth/guards/store-access.guard.js';
import { ScopedStoreId } from '../auth/decorators/scoped-store-id.decorator.js';
import { RequireStoreManager } from '../auth/decorators/require-store-manager.decorator.js';
import { DeliverySettingsService } from './delivery-settings.service.js';
import { UpsertDeliverySettingDto } from './dto/upsert-delivery-setting.dto.js';

@ApiTags('Delivery Settings')
@Controller('stores/:storeId/delivery-settings')
export class DeliverySettingsController {
  constructor(private readonly deliverySettingsService: DeliverySettingsService) {}

  /** Public: country/default options for address form (dropdown). State/city come from frontend or separate API. */
  @Get('address-options')
  @ApiOperation({ summary: 'Get address form options (default country, allowed countries)' })
  @ApiOkResponse({ description: 'default_country, allowed_countries (array or null)' })
  getAddressOptions(@Param('storeId') storeId: string) {
    return this.deliverySettingsService.getAddressOptions(storeId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, StoreAccessGuard)
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
