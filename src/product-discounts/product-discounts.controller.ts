import { Controller } from '@nestjs/common';
import { ProductDiscountsService } from './product-discounts.service.js';

@Controller('stores/:storeId/product-discounts')
export class ProductDiscountsController {
  constructor(private readonly productDiscountsService: ProductDiscountsService) {}
}
