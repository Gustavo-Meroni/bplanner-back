import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common'; // <-- Importamos o Pipe de validação

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Ativamos o validador globalmente
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Remove campos extras que não estão no DTO (Segurança extra!)
    forbidNonWhitelisted: true, // Bloqueia a requisição se enviarem campos não esperados
  }));

  const config = new DocumentBuilder()
    .setTitle('BPlanner API')
    .setDescription('API para gerenciamento de finanças pessoais do BPlanner')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.enableCors();

  await app.listen(3000);
}
bootstrap();