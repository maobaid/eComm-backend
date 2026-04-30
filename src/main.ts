import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { static as serveStatic } from 'express';
import path from 'node:path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  const configService = app.get(ConfigService);

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
