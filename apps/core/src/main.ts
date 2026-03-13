import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ApiKeyGuard } from './common/guards/api-key.guard';

(BigInt.prototype as any).toJSON = function () { return this.toString(); };

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  app.useGlobalGuards(new ApiKeyGuard());
  await app.listen(process.env.PORT ?? 4000);
  console.log(`Core API is running on port ${process.env.PORT ?? 4000}`);
}
bootstrap();
