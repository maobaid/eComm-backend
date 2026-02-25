import { Controller } from '@nestjs/common';
import { DeliverySettingsService } from './delivery-settings.service.js';

@Controller('stores/:storeId/delivery-settings')
export class DeliverySettingsController {
  constructor(private readonly deliverySettingsService: DeliverySettingsService) {}
}
