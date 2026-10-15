import { gerarParcelas, normalizarParcelasManuais, somaDasParcelas } from './parcelamento';
import { paraData, paraIso, somarMeses } from '../common/datas';

describe('gerarParcelas', () => {
  it('divide igualmente quando o valor fecha', () => {
    const parcelas = gerarParcelas(120000, 12, paraData('2026-11-10'));
    expect(parcelas).toHaveLength(12);
    expect(parcelas.every((p) => p.valorCentavos === 10000)).toBe(true);
  });

  it('coloca a sobra de centavos na primeira parcela', () => {
    const parcelas = gerarParcelas(10000, 3, paraData('2026-11-10'));
    expect(parcelas.map((p) => p.valorCentavos)).toEqual([3334, 3333, 3333]);
    expect(somaDasParcelas(parcelas)).toBe(10000);
  });

  it('gera vencimentos mensais mantendo o dia', () => {
    const parcelas = gerarParcelas(30000, 3, paraData('2026-11-10'));
    expect(parcelas.map((p) => paraIso(p.vencimento))).toEqual(['2026-11-10', '2026-12-10', '2027-01-10']);
  });

  it('à vista é uma parcela só', () => {
    const [unica, ...resto] = gerarParcelas(245099, 1, paraData('2026-10-15'));
    expect(resto).toHaveLength(0);
    expect(unica).toMatchObject({ numero: 1, valorCentavos: 245099 });
  });

  it('recusa valores inválidos', () => {
    expect(() => gerarParcelas(0, 3, paraData('2026-11-10'))).toThrow();
    expect(() => gerarParcelas(100.5, 3, paraData('2026-11-10'))).toThrow();
    expect(() => gerarParcelas(1000, 0, paraData('2026-11-10'))).toThrow();
  });
});

describe('somarMeses', () => {
  it('usa o último dia quando o mês é mais curto', () => {
    expect(paraIso(somarMeses(paraData('2027-01-31'), 1))).toBe('2027-02-28');
    expect(paraIso(somarMeses(paraData('2028-01-31'), 1))).toBe('2028-02-29');
    expect(paraIso(somarMeses(paraData('2026-08-31'), 1))).toBe('2026-09-30');
  });
});

describe('normalizarParcelasManuais', () => {
  it('ordena por vencimento e numera de novo', () => {
    const parcelas = normalizarParcelasManuais([
      { valorCentavos: 50000, vencimento: paraData('2026-12-10') },
      { valorCentavos: 100000, vencimento: paraData('2026-11-10') },
    ]);
    expect(parcelas.map((p) => [p.numero, p.valorCentavos])).toEqual([
      [1, 100000],
      [2, 50000],
    ]);
  });
});
