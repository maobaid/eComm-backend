import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
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
import { UploadsModule } from './uploads/uploads.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        errorMessage:
          config.get<string>('CUSTOMIZATION_UPLOAD_THROTTLE_MESSAGE') ??
          'Too many customization image uploads from this network. Please try again shortly.',
        throttlers: [
          {
            ttl: Number(config.get<number>('CUSTOMIZATION_UPLOAD_THROTTLE_TTL_MS') ?? 60_000),
            limit: Number(config.get<number>('CUSTOMIZATION_UPLOAD_THROTTLE_LIMIT') ?? 20),
            blockDuration: Number(
              config.get<number>('CUSTOMIZATION_UPLOAD_THROTTLE_BLOCK_MS') ?? 180_000,
            ),
          },
        ],
      }),
    }),
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
    UploadsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
