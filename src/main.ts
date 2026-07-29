import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Habilita o CORS para aceitar requisições de outras origens (como o Swagger ou Frontend)
  app.enableCors();

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('BPlanner API')
    .setDescription('API para gestão financeira')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();