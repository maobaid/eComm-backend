import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { OrderReceiptsService } from './order-receipts.service.js';
import { OrderWhatsappService } from './order-whatsapp.service.js';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, OrderReceiptsService, OrderWhatsappService],
  exports: [OrdersService],
})
export class OrdersModule {}
