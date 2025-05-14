import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './AppModule';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3000;
  const host = '0.0.0.0';
  
  // Habilitar CORS
  app.enableCors();
  
  // Añadir prefijo global para la API
  app.setGlobalPrefix('api');
  
  app.useGlobalPipes(new ValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('SSC API')
    .setDescription('API del Sistema de Servicios de Salud')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port, host);
  console.log(`🚀 App running on: http://${host}:${port}`);
  console.log(`Health check available at: http://${host}:${port}/api/health`);
}
bootstrap();
