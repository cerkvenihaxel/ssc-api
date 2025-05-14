import { NestFactory } from '@nestjs/core';
import { AppModule } from './AppModule';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3000;
  const host = '0.0.0.0';
  
  // Habilitar CORS
  app.enableCors();
  
  // Añadir prefijo global para la API
  app.setGlobalPrefix('api');
  
  await app.listen(port, host);
  console.log(`🚀 App running on: http://${host}:${port}`);
  console.log(`Health check available at: http://${host}:${port}/api/health`);
}
bootstrap();
