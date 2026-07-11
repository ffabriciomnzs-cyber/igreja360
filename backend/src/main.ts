import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from '@fastify/helmet';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    // trustProxy: atrás do proxy do Railway, para o rate limit e logs
    // enxergarem o IP real do cliente (X-Forwarded-For).
    new FastifyAdapter({ logger: false, trustProxy: true }),
  );

  // Cabeçalhos de segurança (HSTS, no-sniff, etc.). CSP desligado por ser API.
  await app.register(helmet, { contentSecurityPolicy: false });

  app.setGlobalPrefix('v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const corsOrigin = process.env.CORS_ORIGIN ?? '*';
  app.enableCors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(','),
    credentials: true,
  });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  Logger.log(`Igreja360 API running on port ${port} (prefix /v1)`, 'Bootstrap');
}

bootstrap();
