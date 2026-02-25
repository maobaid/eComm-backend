import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { StoresModule } from './stores/stores.module.js';
import { CustomersModule } from './customers/customers.module.js';
import { AddressesModule } from './addresses/addresses.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { ProductsModule } from './products/products.module.js';
import { CouponsModule } from './coupons/coupons.module.js';
import { ProductDiscountsModule } from './product-discounts/product-discounts.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { DeliverySettingsModule } from './delivery-settings/delivery-settings.module.js';
import { AnalyticsModule } from './analytics/analytics.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    StoresModule,
    CustomersModule,
    AddressesModule,
    CategoriesModule,
    ProductsModule,
    CouponsModule,
    ProductDiscountsModule,
    OrdersModule,
    DeliverySettingsModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
