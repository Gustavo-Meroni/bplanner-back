
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Connecting...');
  await prisma.$connect();
  console.log('Connected!');
  try {
    const data = await prisma.despesa.findMany();
    console.log(data);
  } catch(e) {
    console.error('Error during query:', e);
  } finally {
    await prisma.$disconnect();
  }
}
main();

