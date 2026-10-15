/**
 * Utilitários de data de calendário (sem horário).
 * As colunas @db.Date chegam do Prisma como Date à meia-noite UTC,
 * então toda conta aqui é feita em UTC para não "voltar um dia" por fuso.
 */

/** "2026-11-05" → Date(2026-11-05T00:00:00Z) */
export function paraData(iso: string): Date {
  const [ano, mes, dia] = iso.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia));
}

/** Date → "2026-11-05" */
export function paraIso(data: Date): string {
  return data.toISOString().slice(0, 10);
}

/** Date → "2026-11" */
export function chaveDoMes(data: Date): string {
  return data.toISOString().slice(0, 7);
}

/** Hoje (data de calendário, UTC) */
export function hoje(): Date {
  const agora = new Date();
  return new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate()));
}

/**
 * Soma meses mantendo o dia; se o mês não tiver esse dia, usa o último.
 * Ex.: 31/jan + 1 mês = 28/fev (ou 29 em ano bissexto).
 */
export function somarMeses(data: Date, meses: number): Date {
  const ano = data.getUTCFullYear();
  const mes = data.getUTCMonth() + meses;
  const dia = data.getUTCDate();
  const ultimoDia = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
  return new Date(Date.UTC(ano, mes, Math.min(dia, ultimoDia)));
}

/** Diferença em dias inteiros (b - a) */
export function diasEntre(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/** Quantos meses de calendário de a até b (contando o mês de a). Mínimo 1. */
export function mesesAte(a: Date, b: Date): number {
  const meses = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
  return Math.max(meses, 1);
}
