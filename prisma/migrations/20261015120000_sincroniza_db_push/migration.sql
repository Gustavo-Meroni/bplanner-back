-- Sincroniza o histórico de migrations com o estado criado via `prisma db push`
-- (Casal.metaViagem, Perfil, Categoria e a nova estrutura de Despesa).
--
-- Em bancos que JÁ têm essas tabelas (criadas com db push), NÃO rode este SQL:
-- marque como aplicada com
--   npx prisma migrate resolve --applied 20261015120000_sincroniza_db_push
-- Em bancos novos, ela roda normalmente via `prisma migrate deploy`.

-- AlterTable
ALTER TABLE "Casal" ADD COLUMN     "metaViagem" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- DropForeignKey
ALTER TABLE "Despesa" DROP CONSTRAINT "Despesa_casalId_fkey";

-- AlterTable
ALTER TABLE "Despesa" DROP COLUMN "descricao",
DROP COLUMN "isPaga",
DROP COLUMN "responsavel",
DROP COLUMN "valor",
DROP COLUMN "vencimento",
ADD COLUMN     "categoryId" TEXT NOT NULL,
ADD COLUMN     "checked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "value" DOUBLE PRECISION NOT NULL;

-- CreateTable
CREATE TABLE "Perfil" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "limit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "casalId" TEXT NOT NULL,

    CONSTRAINT "Perfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "perfilId" TEXT NOT NULL,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Perfil" ADD CONSTRAINT "Perfil_casalId_fkey" FOREIGN KEY ("casalId") REFERENCES "Casal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Categoria" ADD CONSTRAINT "Categoria_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "Perfil"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Despesa" ADD CONSTRAINT "Despesa_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Categoria"("id") ON DELETE CASCADE ON UPDATE CASCADE;
