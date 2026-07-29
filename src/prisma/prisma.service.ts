import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import * as path from 'path';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    // Apontando direto para a raiz do projeto (onde o arquivo real com as tabelas está!)
    const dbPath = path.join(process.cwd(), 'dev.db');

    const adapter = new PrismaLibSql({
      url: `file:${dbPath}`,
    });

    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
    console.log(`📦 Banco de dados conectado com sucesso em: ${path.join(process.cwd(), 'dev.db')}`);
  }
}