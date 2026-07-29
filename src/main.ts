import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'; // <-- Importamos o Swagger

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Criamos o documento de configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('BPlanner API')
    .setDescription('API para gerenciamento de finanças pessoais do BPlanner')
    .setVersion('1.0')
    .build();

  // 2. Geramos o documento baseado no nosso app
  const document = SwaggerModule.createDocument(app, config);

  // 3. Montamos a página do Swagger na rota '/api'
  SwaggerModule.setup('api', app, document);

  // Ativamos o CORS (isso será essencial quando seu Front-end for consumir a API!)
  app.enableCors();

  await app.listen(3000);
}
bootstrap();