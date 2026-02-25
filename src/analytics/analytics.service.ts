import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

const order = (p: PrismaService) => (p as any).order;
const orderItem = (p: PrismaService) => (p as any).orderItem;

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStoreAnalytics(storeId: string) {
    const ordersList = await order(this.prisma).findMany({
      where: { store_id: storeId },
      select: {
        id: true,
        total_amount: true,
        status: true,
        created_at: true,
        items: { select: { product_id: true, quantity: true } },
      },
    });
    const totalRevenue = ordersList.reduce((s, o) => s + Number(o.total_amount), 0);
    const byStatus: Record<string, number> = {};
    for (const o of ordersList) {
      byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
    }
    const productQty: Record<string, number> = {};
    for (const o of ordersList) {
      for (const item of o.items) {
        productQty[item.product_id] = (productQty[item.product_id] ?? 0) + item.quantity;
      }
    }
    const topProducts = Object.entries(productQty)
      .map(([product_id, quantity]) => ({ product_id, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
    const byMonth: Record<string, number> = {};
    for (const o of ordersList) {
      const key = (o.created_at as Date).toISOString().slice(0, 7);
      byMonth[key] = (byMonth[key] ?? 0) + Number(o.total_amount);
    }
    const monthlyRevenue = Object.entries(byMonth).map(([month, revenue]) => ({ month, revenue }));
    monthlyRevenue.sort((a, b) => a.month.localeCompare(b.month));
    return {
      total_revenue: totalRevenue,
      orders_by_status: byStatus,
      top_products: topProducts,
      monthly_revenue: monthlyRevenue,
    };
  }
}
