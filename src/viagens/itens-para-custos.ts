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
    case BaseDoCusto.POR_PESSOA_NOITE:
      return pessoas * Math.max(noites, 1);
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
 *  - item sem valor (escolhido no catálogo) vira custo sem parcela nenhuma:
 *    fica listado como previsto, esperando o valor na tela de custos
 */
export function itensParaCustos(
  itens: ItemCustoDto[],
  ctx: ContextoDaViagem,
): Prisma.CustoCreateWithoutViagemInput[] {
  return itens.map((item) => {
    const base = item.base ?? BaseDoCusto.FIXO;
    const quantidade = quantidadeDaBase(base, ctx);
    const total = (item.valorUnitarioCentavos ?? 0) * quantidade;
    const hojeData = hoje();
    const primeiroVencimento = item.primeiroVencimento ? paraData(item.primeiroVencimento) : null;

    let parcelas: Prisma.ParcelaCreateWithoutCustoInput[];

    if (total <= 0) {
      // Previsto no onboarding, ainda sem valor
      parcelas = [];
    } else if (item.situacao === SituacaoDoCusto.PAGO) {
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
      observacao: descrever(item, quantidade, ctx),
      ...(parcelas.length > 0 && { parcelas: { create: parcelas } }),
    };
  });
}

/** Deixa registrado como o valor foi calculado, para o usuário entender depois */
function descrever(item: ItemCustoDto, quantidade: number, ctx: ContextoDaViagem): string | null {
  const base = item.base ?? BaseDoCusto.FIXO;
  if (base === BaseDoCusto.FIXO || quantidade <= 1 || !item.valorUnitarioCentavos) return null;

  const noites = Math.max(diasEntre(ctx.dataIda, ctx.dataVolta), 1);
  const dias = noites + 1;
  const pessoas = Math.max(ctx.pessoas, 1);
  const plural = (n: number, um: string, varios: string) => `${n} ${n > 1 ? varios : um}`;

  const partes: Record<BaseDoCusto, string> = {
    [BaseDoCusto.FIXO]: '',
    [BaseDoCusto.POR_PESSOA]: plural(quantidade, 'pessoa', 'pessoas'),
    [BaseDoCusto.POR_NOITE]: plural(quantidade, 'noite', 'noites'),
    [BaseDoCusto.POR_DIA]: plural(quantidade, 'dia', 'dias'),
    [BaseDoCusto.POR_PESSOA_DIA]: `${plural(pessoas, 'pessoa', 'pessoas')} × ${plural(dias, 'dia', 'dias')}`,
    [BaseDoCusto.POR_PESSOA_NOITE]: `${plural(pessoas, 'pessoa', 'pessoas')} × ${plural(noites, 'noite', 'noites')}`,
  };
  return `${formatarBRL(item.valorUnitarioCentavos)} × ${partes[base]}`;
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
