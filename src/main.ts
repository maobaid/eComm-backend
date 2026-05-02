import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { static as serveStatic } from 'express';
import path from 'node:path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  const configService = app.get(ConfigService);

  const trustProxyRaw = (
    configService.get<string>('TRUST_PROXY') ?? configService.get<string>('CUSTOMIZATION_UPLOAD_TRUST_PROXY') ?? ''
  ).toLowerCase();
  if (['1', 'true', 'yes'].includes(trustProxyRaw)) {
    app.set('trust proxy', 1);
  }

  // Log every request (method + path)
  app.use((req: any, _res: any, next: () => void) => {
    console.log(
      `[Request] ${new Date().toISOString()} ${req.method} ${req.url}`,
    );
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const receiptsDir = path.resolve(
    configService.get<string>('ORDER_RECEIPTS_DIR') ?? './storage/receipts',
  );
  app.use('/public/receipts', serveStatic(receiptsDir));

  const customizationUploadDir = path.resolve(
    configService.get<string>('CUSTOMIZATION_UPLOAD_DIR') ?? './storage/customization-uploads',
  );
  app.use('/public/customization-uploads', serveStatic(customizationUploadDir));

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const config = new DocumentBuilder()
    .setTitle('Multi-Tenant Ecommerce API')
    .setDescription('SaaS backend with store-scoped resources and JWT auth')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
