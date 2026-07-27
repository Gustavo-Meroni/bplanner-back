import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    // Agora passamos apenas a "Config" diretamente para o adaptador!
    // Ele mesmo vai se encarregar de gerenciar o @libsql/client
    const adapter = new PrismaLibSql({
      url: 'file:./prisma/dev.db',
    });

    // Ligamos o motor do Prisma
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('📦 Banco de dados conectado com sucesso!');
  }
}