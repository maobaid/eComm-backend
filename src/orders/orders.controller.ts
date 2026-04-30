import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { StoreAccessGuard } from '../auth/guards/store-access.guard.js';
import { ScopedStoreId } from '../auth/decorators/scoped-store-id.decorator.js';
import { RequireStoreManager } from '../auth/decorators/require-store-manager.decorator.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import type { Response } from 'express';

@ApiTags('Orders')
@Controller('stores/:storeId/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create order (public, customer checkout)' })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({ status: 201, description: 'Order created', schema: { example: { id: 'uuid', store_id: 'store-uuid', customer_id: 'uuid', address_id: 'uuid', total_amount: 99.99, total_product_discount_amount: 5, total_coupon_discount_amount: 0, status: 'PENDING', created_at: '2025-02-25T12:00:00.000Z' } } })
  create(@Param('storeId') storeId: string, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(storeId, {
      customer_id: dto.customer_id,
      address_id: dto.address_id,
      items: dto.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      coupon_code: dto.coupon_code,
      scheduled_delivery: dto.scheduled_delivery,
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @ApiOperation({ summary: 'List orders (paginated)' })
  @ApiOkResponse({ description: 'Paginated list with items', schema: { example: { data: [], total: 0, page: 1, limit: 20, totalPages: 1 } } })
  findAll(@ScopedStoreId() storeId: string | undefined, @Query() query: PaginationQueryDto) {
    return this.ordersService.findAll(storeId!, query.page, query.limit);
  }

  @Get(':orderId')
  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @ApiOperation({ summary: 'Get order by id' })
  @ApiOkResponse({ description: 'Order with items, customer, address, coupon', schema: { type: 'object' } })
  findOne(
    @ScopedStoreId() storeId: string | undefined,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.ordersService.findOne(storeId!, orderId);
  }

  @Patch(':orderId/status')
  @RequireStoreManager()
  @ApiOperation({ summary: 'Update order status' })
  @ApiBody({ type: UpdateOrderStatusDto })
  @ApiOkResponse({
    description: 'Order with updated status',
    schema: {
      example: {
        id: 'uuid',
        store_id: 'store-uuid',
        status: 'CONFIRMED',
      },
    },
  })
  updateStatus(
    @ScopedStoreId() storeId: string | undefined,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(storeId!, orderId, dto.status);
  }

  @Post(':orderId/receipt/resend')
  @RequireStoreManager()
  @ApiOperation({ summary: 'Regenerate and resend order receipt via WhatsApp' })
  @ApiOkResponse({ description: 'New receipt send attempt created' })
  resendReceipt(
    @ScopedStoreId() storeId: string | undefined,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.ordersService.resendReceipt(storeId!, orderId);
  }

  @Get(':orderId/receipt')
  @RequireStoreManager()
  @ApiOperation({ summary: 'Download latest order receipt PDF' })
  async downloadReceipt(
    @ScopedStoreId() storeId: string | undefined,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Res() res: Response,
  ) {
    const receipt = await this.ordersService.getLatestReceipt(storeId!, orderId);
    res.setHeader('Content-Type', receipt.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${receipt.fileName}"`);
    receipt.stream.pipe(res);
  }
}
