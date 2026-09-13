import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  app.use(helmet());
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.enableCors({ origin: config.getOrThrow<string>('FRONTEND_ORIGIN'), credentials: true });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, forbidNonWhitelisted: true, transform: true,
  }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableShutdownHooks();
  const document = SwaggerModule.createDocument(app,
    new DocumentBuilder().setTitle('Mood Garden API')
      .setDescription('Mood Garden: authentication, profile and preferences. Auth requests require X-Mood-Garden: 1.')
      .setVersion('0.1.0').addBearerAuth().build());
  SwaggerModule.setup('api/docs', app, document);
  const port = config.getOrThrow<number>('PORT');
  await app.listen(port);
  Logger.log('API: http://localhost:' + port + '/api | Swagger: /api/docs', 'Bootstrap');
}
bootstrap().catch((error: unknown) => {
  Logger.error(error, undefined, 'Bootstrap');
  process.exitCode = 1;
});
