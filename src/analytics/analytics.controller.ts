import { Controller } from '@nestjs/common';
import { AnalyticsService } from './analytics.service.js';

@Controller('stores/:storeId/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}
}
