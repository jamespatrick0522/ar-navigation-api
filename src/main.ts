import {NestFactory} from '@nestjs/core';
import {ValidationPipe} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {DocumentBuilder, SwaggerModule} from '@nestjs/swagger';
import {AppModule} from './app.module';

const resolveCorsOrigins = (corsOrigin: string) => {
  if (!corsOrigin || corsOrigin.trim() === '*' || corsOrigin.trim().toLowerCase() === 'mobile') {
    return true;
  }

  const allowedOrigins = corsOrigin
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

  return (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    callback(null, allowedOrigins.includes(origin));
  };
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: resolveCorsOrigins(configService.get<string>('CORS_ORIGIN', '*')),
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('AR Navigation API')
    .setDescription('Public directory and QR-first navigation preview API')
    .setVersion('1.0.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(configService.get<number>('PORT', 3000), '0.0.0.0');
}

void bootstrap();
