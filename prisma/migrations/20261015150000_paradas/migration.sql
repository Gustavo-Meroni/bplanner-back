-- Destinos passam a ser paradas (1..N) em vez de colunas na Viagem.
-- Viagens que já tinham destino viram uma viagem com 1 parada.

-- CreateTable
CREATE TABLE "Parada" (
    "id" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "regiao" TEXT,
    "pais" TEXT,
    "codigoPais" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "aeroporto" TEXT,
    "chegada" DATE,
    "saida" DATE,
    "viagemId" TEXT NOT NULL,

    CONSTRAINT "Parada_pkey" PRIMARY KEY ("id")
);

-- Dados: destino atual → parada 1
INSERT INTO "Parada" ("id", "ordem", "nome", "regiao", "pais", "codigoPais", "lat", "lng", "viagemId")
SELECT gen_random_uuid()::TEXT, 1, "destinoNome", "destinoRegiao", "destinoPais", "destinoCodigoPais", "destinoLat", "destinoLng", "id"
FROM "Viagem"
WHERE "destinoNome" IS NOT NULL AND "destinoLat" IS NOT NULL AND "destinoLng" IS NOT NULL;

-- AlterTable
ALTER TABLE "Viagem" DROP COLUMN "destinoCodigoPais",
DROP COLUMN "destinoLat",
DROP COLUMN "destinoLng",
DROP COLUMN "destinoNome",
DROP COLUMN "destinoPais",
DROP COLUMN "destinoRegiao",
ADD COLUMN     "origemAeroporto" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Parada_viagemId_ordem_key" ON "Parada"("viagemId", "ordem");

-- AddForeignKey
ALTER TABLE "Parada" ADD CONSTRAINT "Parada_viagemId_fkey" FOREIGN KEY ("viagemId") REFERENCES "Viagem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
