import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { StoreAccessGuard } from '../auth/guards/store-access.guard.js';
import { ScopedStoreId } from '../auth/decorators/scoped-store-id.decorator.js';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';

@Controller('stores/:storeId/orders')
@UseGuards(JwtAuthGuard, StoreAccessGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(
    @ScopedStoreId() storeId: string | undefined,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.create(storeId!, {
      customer_id: dto.customer_id,
      address_id: dto.address_id,
      items: dto.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      coupon_code: dto.coupon_code,
      scheduled_delivery: dto.scheduled_delivery,
    });
  }
}
