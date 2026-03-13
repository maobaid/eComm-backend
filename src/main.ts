import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { RequestLogGuard } from './common/request-log.guard.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Log every request (method + path) so POST and 403s show up in Render logs
  app.use((req: any, _res: any, next: () => void) => {
    console.log(
      `[Request] ${new Date().toISOString()} ${req.method} ${req.url}`,
    );
    next();
  });

  // Log when request reaches guard phase (confirms route was matched and guards are running)
  app.useGlobalGuards(new RequestLogGuard());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
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
