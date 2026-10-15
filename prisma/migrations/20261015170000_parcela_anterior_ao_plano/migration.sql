-- Parcelas que já estavam pagas quando a viagem foi planejada (ex.: passagem
-- comprada antes). Ficam fora da meta e não contam como progresso.
ALTER TABLE "Parcela" ADD COLUMN     "anteriorAoPlano" BOOLEAN NOT NULL DEFAULT false;
