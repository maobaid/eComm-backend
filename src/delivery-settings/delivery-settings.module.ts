import { Module } from '@nestjs/common';
import { DeliverySettingsController } from './delivery-settings.controller.js';
import { DeliverySettingsService } from './delivery-settings.service.js';

@Module({
  controllers: [DeliverySettingsController],
  providers: [DeliverySettingsService],
  exports: [DeliverySettingsService],
})
export class DeliverySettingsModule {}
