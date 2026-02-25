import { Controller } from '@nestjs/common';
import { CouponsService } from './coupons.service.js';

@Controller('stores/:storeId/coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}
}
