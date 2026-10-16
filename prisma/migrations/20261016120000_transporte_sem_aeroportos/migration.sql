-- O app deixa de ser só de viagem de avião: o que importa é a cidade, não o
-- aeroporto. Em troca, a viagem passa a registrar o meio de transporte, que
-- sugere os gastos no onboarding.

-- CreateEnum
CREATE TYPE "TipoTransporte" AS ENUM ('AVIAO', 'CARRO', 'ONIBUS', 'OUTRO');

-- AlterTable
ALTER TABLE "Viagem" ADD COLUMN     "transporte" "TipoTransporte",
DROP COLUMN "origemAeroporto";

-- AlterTable
ALTER TABLE "Parada" DROP COLUMN "aeroporto";
