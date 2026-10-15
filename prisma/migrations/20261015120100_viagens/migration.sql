-- ═════════════════════════════════════════════════════════════════════════════
-- BPlanner: de "casal" para "viagens"
--
--  Casal                       → Viagem (mesmo id; meta vira centavos)
--  Usuario.casalId             → Participante (1º a entrar = DONO)
--  Casal.codigoConvite         → Convite (os códigos antigos continuam valendo)
--  Aporte (mes texto, Float)   → Aporte (data, centavos)
--  Perfil/Categoria/Despesa    → Custo + 1 Parcela (paga se estava marcada)
--
-- Faça backup antes. O script roda em uma transação: se algo falhar, nada muda.
-- ═════════════════════════════════════════════════════════════════════════════

-- CreateEnum
CREATE TYPE "PapelParticipante" AS ENUM ('DONO', 'MEMBRO');

-- CreateEnum
CREATE TYPE "CategoriaCusto" AS ENUM ('TRANSPORTE', 'HOSPEDAGEM', 'ALIMENTACAO', 'PASSEIOS', 'COMPRAS', 'SEGURO', 'DOCUMENTOS', 'OUTROS');

-- CreateTable
CREATE TABLE "Viagem" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "destinoNome" TEXT,
    "destinoRegiao" TEXT,
    "destinoPais" TEXT,
    "destinoCodigoPais" TEXT,
    "destinoLat" DOUBLE PRECISION,
    "destinoLng" DOUBLE PRECISION,
    "origemNome" TEXT,
    "origemLat" DOUBLE PRECISION,
    "origemLng" DOUBLE PRECISION,
    "dataIda" DATE,
    "dataVolta" DATE,
    "metaCentavos" INTEGER NOT NULL DEFAULT 0,
    "estimativa" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Viagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participante" (
    "id" TEXT NOT NULL,
    "papel" "PapelParticipante" NOT NULL DEFAULT 'MEMBRO',
    "entrouEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT NOT NULL,
    "viagemId" TEXT NOT NULL,

    CONSTRAINT "Participante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Convite" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viagemId" TEXT NOT NULL,
    "criadoPorId" TEXT,

    CONSTRAINT "Convite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Custo" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" "CategoriaCusto" NOT NULL DEFAULT 'OUTROS',
    "valorTotalCentavos" INTEGER NOT NULL,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "viagemId" TEXT NOT NULL,
    "responsavelId" TEXT,

    CONSTRAINT "Custo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parcela" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "vencimento" DATE NOT NULL,
    "pagaEm" DATE,
    "pagaComCofre" BOOLEAN NOT NULL DEFAULT false,
    "custoId" TEXT NOT NULL,

    CONSTRAINT "Parcela_pkey" PRIMARY KEY ("id")
);

-- ── Dados: Casal → Viagem ─────────────────────────────────────────────────────
-- O destino fica vazio: no próximo acesso, o onboarding pede destino e datas.
INSERT INTO "Viagem" ("id", "nome", "metaCentavos", "createdAt", "updatedAt")
SELECT "id", "nome", ROUND("metaViagem" * 100)::INTEGER, "createdAt", CURRENT_TIMESTAMP
FROM "Casal";

-- ── Dados: Usuario.casalId → Participante ─────────────────────────────────────
INSERT INTO "Participante" ("id", "papel", "entrouEm", "usuarioId", "viagemId")
SELECT
    gen_random_uuid()::TEXT,
    (CASE WHEN ROW_NUMBER() OVER (PARTITION BY "casalId" ORDER BY "createdAt", "id") = 1
          THEN 'DONO' ELSE 'MEMBRO' END)::"PapelParticipante",
    "createdAt",
    "id",
    "casalId"
FROM "Usuario"
WHERE "casalId" IS NOT NULL;

-- ── Dados: código do casal → Convite ──────────────────────────────────────────
INSERT INTO "Convite" ("id", "codigo", "viagemId")
SELECT gen_random_uuid()::TEXT, "codigoConvite", "id"
FROM "Casal";

-- ── Dados: Aporte (mês em texto → data, Float → centavos) ─────────────────────
ALTER TABLE "Aporte" ADD COLUMN "valorCentavos" INTEGER,
ADD COLUMN "data" DATE,
ADD COLUMN "viagemId" TEXT,
ADD COLUMN "participanteId" TEXT;

-- Aportes sem casal não pertencem a nenhuma viagem e são descartados
DELETE FROM "Aporte" WHERE "casalId" IS NULL;

UPDATE "Aporte" SET
    "valorCentavos" = ROUND("valor" * 100)::INTEGER,
    "viagemId" = "casalId",
    "data" = CASE
        WHEN "mes" ~ '^(Jan|Fev|Mar|Abr|Mai|Jun|Jul|Ago|Set|Out|Nov|Dez)/[0-9]{4}$' THEN make_date(
            split_part("mes", '/', 2)::INTEGER,
            array_position(ARRAY['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'], split_part("mes", '/', 1)),
            1)
        WHEN "mes" ~ '^[0-9]{4}-[0-9]{2}$' THEN to_date("mes" || '-01', 'YYYY-MM-DD')
        WHEN lower("mes") = ANY (ARRAY['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']) THEN make_date(
            EXTRACT(YEAR FROM "createdAt")::INTEGER,
            array_position(ARRAY['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'], lower("mes")),
            1)
        ELSE "createdAt"::DATE
    END;

-- DropForeignKey
ALTER TABLE "Aporte" DROP CONSTRAINT "Aporte_casalId_fkey";

-- AlterTable
ALTER TABLE "Aporte" DROP COLUMN "casalId",
DROP COLUMN "mes",
DROP COLUMN "valor",
ALTER COLUMN "valorCentavos" SET NOT NULL,
ALTER COLUMN "data" SET NOT NULL,
ALTER COLUMN "viagemId" SET NOT NULL;

-- ── Dados: Despesa → Custo + Parcela ──────────────────────────────────────────
INSERT INTO "Custo" ("id", "nome", "categoria", "valorTotalCentavos", "observacao", "createdAt", "updatedAt", "viagemId")
SELECT
    d."id",
    d."name",
    'OUTROS'::"CategoriaCusto",
    ROUND(d."value" * 100)::INTEGER,
    'Importado de "' || c."name" || '" (' || p."name" || ')',
    d."createdAt",
    CURRENT_TIMESTAMP,
    p."casalId"
FROM "Despesa" d
JOIN "Categoria" c ON c."id" = d."categoryId"
JOIN "Perfil" p ON p."id" = c."perfilId";

INSERT INTO "Parcela" ("id", "numero", "valorCentavos", "vencimento", "pagaEm", "pagaComCofre", "custoId")
SELECT
    gen_random_uuid()::TEXT,
    1,
    ROUND(d."value" * 100)::INTEGER,
    v."vencimento",
    CASE WHEN d."checked" THEN v."vencimento" END,
    false,
    d."id"
FROM "Despesa" d
CROSS JOIN LATERAL (
    SELECT CASE
        WHEN d."mes" ~ '^(Jan|Fev|Mar|Abr|Mai|Jun|Jul|Ago|Set|Out|Nov|Dez)/[0-9]{4}$' THEN make_date(
            split_part(d."mes", '/', 2)::INTEGER,
            array_position(ARRAY['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'], split_part(d."mes", '/', 1)),
            1)
        WHEN d."mes" ~ '^[0-9]{4}-[0-9]{2}$' THEN to_date(d."mes" || '-01', 'YYYY-MM-DD')
        ELSE d."createdAt"::DATE
    END AS "vencimento"
) v
WHERE EXISTS (SELECT 1 FROM "Custo" cu WHERE cu."id" = d."id");

-- ── Remove a estrutura antiga ─────────────────────────────────────────────────
-- DropTable
DROP TABLE "Despesa";

-- DropTable
DROP TABLE "Categoria";

-- DropTable
DROP TABLE "Perfil";

-- DropForeignKey
ALTER TABLE "Usuario" DROP CONSTRAINT "Usuario_casalId_fkey";

-- AlterTable
ALTER TABLE "Usuario" DROP COLUMN "casalId";

-- DropTable
DROP TABLE "Casal";

-- CreateIndex
CREATE INDEX "Participante_viagemId_idx" ON "Participante"("viagemId");

-- CreateIndex
CREATE UNIQUE INDEX "Participante_usuarioId_viagemId_key" ON "Participante"("usuarioId", "viagemId");

-- CreateIndex
CREATE UNIQUE INDEX "Convite_codigo_key" ON "Convite"("codigo");

-- CreateIndex
CREATE INDEX "Convite_viagemId_idx" ON "Convite"("viagemId");

-- CreateIndex
CREATE INDEX "Aporte_viagemId_data_idx" ON "Aporte"("viagemId", "data");

-- CreateIndex
CREATE INDEX "Custo_viagemId_idx" ON "Custo"("viagemId");

-- CreateIndex
CREATE INDEX "Parcela_vencimento_idx" ON "Parcela"("vencimento");

-- CreateIndex
CREATE UNIQUE INDEX "Parcela_custoId_numero_key" ON "Parcela"("custoId", "numero");

-- AddForeignKey
ALTER TABLE "Participante" ADD CONSTRAINT "Participante_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participante" ADD CONSTRAINT "Participante_viagemId_fkey" FOREIGN KEY ("viagemId") REFERENCES "Viagem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Convite" ADD CONSTRAINT "Convite_viagemId_fkey" FOREIGN KEY ("viagemId") REFERENCES "Viagem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Convite" ADD CONSTRAINT "Convite_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aporte" ADD CONSTRAINT "Aporte_viagemId_fkey" FOREIGN KEY ("viagemId") REFERENCES "Viagem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aporte" ADD CONSTRAINT "Aporte_participanteId_fkey" FOREIGN KEY ("participanteId") REFERENCES "Participante"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Custo" ADD CONSTRAINT "Custo_viagemId_fkey" FOREIGN KEY ("viagemId") REFERENCES "Viagem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Custo" ADD CONSTRAINT "Custo_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Participante"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parcela" ADD CONSTRAINT "Parcela_custoId_fkey" FOREIGN KEY ("custoId") REFERENCES "Custo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
