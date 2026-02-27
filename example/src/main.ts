import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const fastifyAdapter = new FastifyAdapter();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyAdapter,
  );

  app.setGlobalPrefix('/api');

  const swagger = new DocumentBuilder().build();
  const document = SwaggerModule.createDocument(app, swagger);

  SwaggerModule.setup('swagger', app, document);

  await app.listen(3000);
}
bootstrap();
