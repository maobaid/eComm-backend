import { Controller } from '@nestjs/common';
import { ProductsService } from './products.service.js';

@Controller('stores/:storeId/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}
}
