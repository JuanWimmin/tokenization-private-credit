import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ApiKeyGuard } from './common/guards/api-key.guard';

(BigInt.prototype as any).toJSON = function () { return this.toString(); };

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : []),
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Allow any vercel.app preview URL for this project
      if (origin.endsWith('.vercel.app')) return callback(null, true);
      callback(new Error(`CORS blocked: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const config = new DocumentBuilder()
    .setTitle('Tokenization Private Credit API')
    .setDescription('Backend API for the tokenization platform — campaigns, investments, loans, deploy, vault, token-sale')
    .setVersion('1.0')
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'api-key')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  app.useGlobalGuards(new ApiKeyGuard());
  await app.listen(process.env.PORT ?? 4000);
  console.log(`Core API is running on port ${process.env.PORT ?? 4000}`);
  console.log(`Swagger docs available at http://localhost:${process.env.PORT ?? 4000}/api-docs`);
}
bootstrap();
