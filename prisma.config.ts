import { defineConfig } from '@prisma/config';
import * as dotenv from 'dotenv';

// Carrega as variáveis do seu arquivo .env
dotenv.config();

export default defineConfig({
  datasource: {
    // Para migrações, usamos a DIRECT_URL (porta 5432)
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
});