import { Prisma } from '@prisma/client';
import { BaseDoCusto, ItemCustoDto, SituacaoDoCusto } from './dto/viagem.dto';
import { gerarParcelas } from '../custos/parcelamento';
import { diasEntre, hoje, paraData } from '../common/datas';

export interface ContextoDaViagem {
  pessoas: number;
  dataIda: Date;
  dataVolta: Date;
}

/** Quantas vezes o valor unitário se repete, conforme a base escolhida */
export function quantidadeDaBase(base: BaseDoCusto, ctx: ContextoDaViagem): number {
  const noites = Math.max(diasEntre(ctx.dataIda, ctx.dataVolta), 0);
  const dias = noites + 1;
  const pessoas = Math.max(ctx.pessoas, 1);

  switch (base) {
    case BaseDoCusto.POR_PESSOA:
      return pessoas;
    case BaseDoCusto.POR_NOITE:
      return Math.max(noites, 1);
    case BaseDoCusto.POR_DIA:
      return dias;
    case BaseDoCusto.POR_PESSOA_DIA:
      return pessoas * dias;
    case BaseDoCusto.FIXO:
    default:
      return 1;
  }
}

/**
 * Converte os itens do onboarding em custos com parcelas.
 *
 * Regras:
 *  - "já paguei" vira uma parcela quitada e marcada como anterior ao plano:
 *    aparece na lista de custos, mas fica fora da meta e do progresso
 *  - "parcelado" gera N parcelas mensais; as que o usuário já pagou também
 *    entram como anteriores ao plano
 *  - "a pagar" vira uma parcela única vencendo no embarque
 */
export function itensParaCustos(
  itens: ItemCustoDto[],
  ctx: ContextoDaViagem,
): Prisma.CustoCreateWithoutViagemInput[] {
  return itens.map((item) => {
    const quantidade = quantidadeDaBase(item.base, ctx);
    const total = item.valorUnitarioCentavos * quantidade;
    const hojeData = hoje();
    const primeiroVencimento = item.primeiroVencimento ? paraData(item.primeiroVencimento) : null;

    let parcelas: Prisma.ParcelaCreateWithoutCustoInput[];

    if (item.situacao === SituacaoDoCusto.PAGO) {
      const pagaEm = primeiroVencimento ?? hojeData;
      parcelas = [{ numero: 1, valorCentavos: total, vencimento: pagaEm, pagaEm, anteriorAoPlano: true }];
    } else if (item.situacao === SituacaoDoCusto.PARCELADO) {
      const quantidadeParcelas = item.parcelas ?? 2;
      const jaPagas = Math.min(item.parcelasPagas ?? 0, quantidadeParcelas);
      parcelas = gerarParcelas(total, quantidadeParcelas, primeiroVencimento ?? hojeData).map((p) => ({
        numero: p.numero,
        valorCentavos: p.valorCentavos,
        vencimento: p.vencimento,
        ...(p.numero <= jaPagas && { pagaEm: p.vencimento, anteriorAoPlano: true }),
      }));
    } else {
      parcelas = [{ numero: 1, valorCentavos: total, vencimento: primeiroVencimento ?? ctx.dataIda }];
    }

    return {
      nome: item.nome.trim(),
      categoria: item.categoria ?? 'OUTROS',
      valorTotalCentavos: total,
      observacao: descrever(item, quantidade),
      parcelas: { create: parcelas },
    };
  });
}

/** Deixa registrado como o valor foi calculado, para o usuário entender depois */
function descrever(item: ItemCustoDto, quantidade: number): string | null {
  if (item.base === BaseDoCusto.FIXO || quantidade <= 1) return null;
  const unidade: Record<BaseDoCusto, string> = {
    [BaseDoCusto.FIXO]: '',
    [BaseDoCusto.POR_PESSOA]: quantidade > 1 ? 'pessoas' : 'pessoa',
    [BaseDoCusto.POR_NOITE]: quantidade > 1 ? 'noites' : 'noite',
    [BaseDoCusto.POR_DIA]: quantidade > 1 ? 'dias' : 'dia',
    [BaseDoCusto.POR_PESSOA_DIA]: 'pessoas × dias',
  };
  return `${formatarBRL(item.valorUnitarioCentavos)} × ${quantidade} ${unidade[item.base]}`.trim();
}

/** "R$ 1.234,50" — sem depender do ICU do Node, que varia entre instalações */
function formatarBRL(centavos: number): string {
  const inteiro = Math.floor(centavos / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$ ${inteiro},${(centavos % 100).toString().padStart(2, '0')}`;
}

/** Quanto ainda falta pagar: é a meta sugerida no fim do onboarding */
export function totalAPagar(custos: Prisma.CustoCreateWithoutViagemInput[]): number {
  return custos.reduce((total, custo) => {
    const parcelas = (custo.parcelas?.create ?? []) as Prisma.ParcelaCreateWithoutCustoInput[];
    return total + parcelas.filter((p) => !p.pagaEm).reduce((s, p) => s + p.valorCentavos, 0);
  }, 0);
}
