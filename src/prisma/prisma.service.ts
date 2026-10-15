import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor(configService: ConfigService) {
    const pool = new Pool({
      connectionString: configService.get<string>('DATABASE_URL'),
      // Supabase exige SSL. Para um Postgres local sem SSL, use DATABASE_SSL=false no .env
      ssl: configService.get<string>('DATABASE_SSL') === 'false' ? undefined : { rejectUnauthorized: false },
    });
    super({ adapter: new PrismaPg(pool) });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Conectado ao PostgreSQL');
  }
}
