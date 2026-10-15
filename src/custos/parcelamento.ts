import { somarMeses } from '../common/datas';

export interface ParcelaGerada {
  numero: number;
  valorCentavos: number;
  vencimento: Date;
}

/**
 * Divide um valor em N parcelas mensais.
 * A sobra de centavos vai para a primeira parcela, então a soma sempre fecha:
 * R$ 100,00 em 3x → 33,34 + 33,33 + 33,33.
 */
export function gerarParcelas(totalCentavos: number, quantidade: number, primeiroVencimento: Date): ParcelaGerada[] {
  if (!Number.isInteger(totalCentavos) || totalCentavos <= 0) {
    throw new Error('O valor total precisa ser um inteiro positivo (centavos).');
  }
  if (!Number.isInteger(quantidade) || quantidade < 1) {
    throw new Error('A quantidade de parcelas precisa ser pelo menos 1.');
  }

  const base = Math.floor(totalCentavos / quantidade);
  const sobra = totalCentavos - base * quantidade;

  return Array.from({ length: quantidade }, (_, i) => ({
    numero: i + 1,
    valorCentavos: base + (i === 0 ? sobra : 0),
    vencimento: somarMeses(primeiroVencimento, i),
  }));
}

/** Parcelas informadas uma a uma (ex.: entrada maior + parcelas iguais), ordenadas por vencimento. */
export function normalizarParcelasManuais(
  parcelas: Array<{ valorCentavos: number; vencimento: Date }>,
): ParcelaGerada[] {
  if (parcelas.length === 0) {
    throw new Error('Informe pelo menos uma parcela.');
  }
  return [...parcelas]
    .sort((a, b) => a.vencimento.getTime() - b.vencimento.getTime())
    .map((p, i) => ({ numero: i + 1, valorCentavos: p.valorCentavos, vencimento: p.vencimento }));
}

export function somaDasParcelas(parcelas: Array<{ valorCentavos: number }>): number {
  return parcelas.reduce((total, p) => total + p.valorCentavos, 0);
}
