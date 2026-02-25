import { Module } from '@nestjs/common';
import { ProductDiscountsController } from './product-discounts.controller.js';
import { ProductDiscountsService } from './product-discounts.service.js';

@Module({
  controllers: [ProductDiscountsController],
  providers: [ProductDiscountsService],
  exports: [ProductDiscountsService],
})
export class ProductDiscountsModule {}
