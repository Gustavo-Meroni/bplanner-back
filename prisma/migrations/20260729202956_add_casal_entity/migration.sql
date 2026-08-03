-- AlterTable
ALTER TABLE "Aporte" ADD COLUMN     "casalId" TEXT;

-- AlterTable
ALTER TABLE "Despesa" ADD COLUMN     "casalId" TEXT;

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "casalId" TEXT;

-- CreateTable
CREATE TABLE "Casal" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "codigoConvite" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Casal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Casal_codigoConvite_key" ON "Casal"("codigoConvite");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_casalId_fkey" FOREIGN KEY ("casalId") REFERENCES "Casal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aporte" ADD CONSTRAINT "Aporte_casalId_fkey" FOREIGN KEY ("casalId") REFERENCES "Casal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Despesa" ADD CONSTRAINT "Despesa_casalId_fkey" FOREIGN KEY ("casalId") REFERENCES "Casal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
