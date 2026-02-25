import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { StoreAccessGuard } from '../auth/guards/store-access.guard.js';
import { ScopedStoreId } from '../auth/decorators/scoped-store-id.decorator.js';
import { AnalyticsService } from './analytics.service.js';

@ApiTags('Analytics')
@Controller('stores/:storeId/analytics')
@UseGuards(JwtAuthGuard, StoreAccessGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  @ApiOperation({ summary: 'Store analytics (revenue, orders by status, top products, monthly revenue)' })
  @ApiOkResponse({ schema: { example: { total_revenue: 1000, orders_by_status: { PENDING: 2, CONFIRMED: 5 }, top_products: [{ product_id: 'uuid', quantity: 10 }], monthly_revenue: [{ month: '2025-02', revenue: 500 }] } } })
  getStoreAnalytics(@ScopedStoreId() storeId: string | undefined) {
    return this.analyticsService.getStoreAnalytics(storeId!);
  }
}
