import { itensParaCustos, quantidadeDaBase, totalAPagar } from './itens-para-custos';
import { BaseDoCusto, ItemCustoDto, SituacaoDoCusto } from './dto/viagem.dto';
import { paraData, paraIso } from '../common/datas';

const ctx = { pessoas: 3, dataIda: paraData('2026-12-27'), dataVolta: paraData('2027-01-03') };
// 7 noites, 8 dias

const item = (extra: Partial<ItemCustoDto>): ItemCustoDto => ({
  nome: 'Item',
  valorUnitarioCentavos: 10000,
  base: BaseDoCusto.FIXO,
  situacao: SituacaoDoCusto.A_PAGAR,
  ...extra,
});

describe('quantidadeDaBase', () => {
  it('multiplica conforme a base escolhida', () => {
    expect(quantidadeDaBase(BaseDoCusto.FIXO, ctx)).toBe(1);
    expect(quantidadeDaBase(BaseDoCusto.POR_PESSOA, ctx)).toBe(3);
    expect(quantidadeDaBase(BaseDoCusto.POR_NOITE, ctx)).toBe(7);
    expect(quantidadeDaBase(BaseDoCusto.POR_DIA, ctx)).toBe(8);
    expect(quantidadeDaBase(BaseDoCusto.POR_PESSOA_DIA, ctx)).toBe(24);
  });

  it('bate-volta no mesmo dia conta 1 dia e 1 noite mínima', () => {
    const ida = { pessoas: 1, dataIda: paraData('2026-12-27'), dataVolta: paraData('2026-12-27') };
    expect(quantidadeDaBase(BaseDoCusto.POR_DIA, ida)).toBe(1);
    expect(quantidadeDaBase(BaseDoCusto.POR_NOITE, ida)).toBe(1);
  });
});

describe('itensParaCustos', () => {
  it('a pagar vira uma parcela vencendo no embarque', () => {
    const [custo] = itensParaCustos([item({ base: BaseDoCusto.POR_PESSOA, valorUnitarioCentavos: 200000 })], ctx);
    expect(custo.valorTotalCentavos).toBe(600000);
    const parcelas = custo.parcelas!.create as any[];
    expect(parcelas).toHaveLength(1);
    expect(paraIso(parcelas[0].vencimento)).toBe('2026-12-27');
    expect(parcelas[0].pagaEm).toBeUndefined();
  });

  it('já paguei fica quitado e fora da meta', () => {
    const custos = itensParaCustos([item({ situacao: SituacaoDoCusto.PAGO })], ctx);
    const [parcela] = custos[0].parcelas!.create as any[];
    expect(parcela.pagaEm).toBeDefined();
    expect(parcela.anteriorAoPlano).toBe(true);
    expect(totalAPagar(custos)).toBe(0);
  });

  it('parcelado marca as já pagas e só o resto conta na meta', () => {
    const custos = itensParaCustos(
      [
        item({
          valorUnitarioCentavos: 45000,
          base: BaseDoCusto.POR_NOITE,
          situacao: SituacaoDoCusto.PARCELADO,
          parcelas: 10,
          parcelasPagas: 3,
          primeiroVencimento: '2026-11-10',
        }),
      ],
      ctx,
    );
    const parcelas = custos[0].parcelas!.create as any[];
    expect(custos[0].valorTotalCentavos).toBe(315000); // 450 x 7 noites
    expect(parcelas).toHaveLength(10);
    expect(parcelas.filter((p) => p.pagaEm)).toHaveLength(3);
    expect(parcelas.every((p) => !p.pagaEm || p.anteriorAoPlano)).toBe(true);
    expect(totalAPagar(custos)).toBe(315000 - parcelas.slice(0, 3).reduce((s, p) => s + p.valorCentavos, 0));
    expect(paraIso(parcelas[0].vencimento)).toBe('2026-11-10');
  });

  it('registra como o valor foi calculado', () => {
    const [custo] = itensParaCustos([item({ base: BaseDoCusto.POR_PESSOA_DIA, valorUnitarioCentavos: 30000 })], ctx);
    expect(custo.observacao).toBe('R$ 300,00 × 24 pessoas × dias');
    const [fixo] = itensParaCustos([item({})], ctx);
    expect(fixo.observacao).toBeNull();
  });

  it('soma só o que falta pagar em uma lista mista', () => {
    const custos = itensParaCustos(
      [
        item({ nome: 'Passagem', valorUnitarioCentavos: 200000, base: BaseDoCusto.POR_PESSOA, situacao: SituacaoDoCusto.PAGO }),
        item({ nome: 'Passeios', valorUnitarioCentavos: 80000 }),
      ],
      ctx,
    );
    expect(totalAPagar(custos)).toBe(80000);
  });
});
