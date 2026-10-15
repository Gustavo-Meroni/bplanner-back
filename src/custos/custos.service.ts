import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Custo, Parcela, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { hoje, paraData, paraIso } from '../common/datas';
import { CreateCustoDto, PagamentoDto, UpdateCustoDto, UpdateParcelaDto } from './dto/custo.dto';
import { gerarParcelas, normalizarParcelasManuais, ParcelaGerada, somaDasParcelas } from './parcelamento';

type CustoCompleto = Custo & {
  parcelas: Parcela[];
  responsavel: { id: string; usuario: { nome: string } } | null;
};

const INCLUIR = {
  parcelas: { orderBy: { numero: 'asc' } },
  responsavel: { select: { id: true, usuario: { select: { nome: true } } } },
} satisfies Prisma.CustoInclude;

@Injectable()
export class CustosService {
  constructor(private prisma: PrismaService) {}

  async listar(viagemId: string) {
    const custos = await this.prisma.custo.findMany({
      where: { viagemId },
      include: INCLUIR,
      orderBy: { createdAt: 'asc' },
    });
    return custos.map(formatar);
  }

  async criar(viagemId: string, dto: CreateCustoDto) {
    if (dto.responsavelId) await this.garantirParticipante(viagemId, dto.responsavelId);
    const parcelas = this.montarParcelas(dto.pagamento);

    const custo = await this.prisma.custo.create({
      data: {
        viagemId,
        nome: dto.nome.trim(),
        categoria: dto.categoria ?? 'OUTROS',
        observacao: dto.observacao?.trim() || null,
        responsavelId: dto.responsavelId ?? null,
        valorTotalCentavos: somaDasParcelas(parcelas),
        parcelas: { create: parcelas },
      },
      include: INCLUIR,
    });
    return formatar(custo);
  }

  async atualizar(viagemId: string, custoId: string, dto: UpdateCustoDto) {
    await this.buscar(viagemId, custoId);
    if (dto.responsavelId) await this.garantirParticipante(viagemId, dto.responsavelId);

    const custo = await this.prisma.custo.update({
      where: { id: custoId },
      data: {
        ...(dto.nome !== undefined && { nome: dto.nome.trim() }),
        ...(dto.categoria !== undefined && { categoria: dto.categoria }),
        ...(dto.observacao !== undefined && { observacao: dto.observacao?.trim() || null }),
        ...(dto.responsavelId !== undefined && { responsavelId: dto.responsavelId }),
      },
      include: INCLUIR,
    });
    return formatar(custo);
  }

  /** Troca o parcelamento inteiro. Bloqueado se já houver parcela paga, para não perder o histórico. */
  async reparcelar(viagemId: string, custoId: string, pagamento: PagamentoDto) {
    const atual = await this.buscar(viagemId, custoId);
    if (atual.parcelas.some((p) => p.pagaEm)) {
      throw new ConflictException('Desmarque as parcelas já pagas antes de mudar o parcelamento.');
    }
    const parcelas = this.montarParcelas(pagamento);

    const custo = await this.prisma.$transaction(async (tx) => {
      await tx.parcela.deleteMany({ where: { custoId } });
      return tx.custo.update({
        where: { id: custoId },
        data: { valorTotalCentavos: somaDasParcelas(parcelas), parcelas: { create: parcelas } },
        include: INCLUIR,
      });
    });
    return formatar(custo);
  }

  async excluir(viagemId: string, custoId: string) {
    await this.buscar(viagemId, custoId);
    await this.prisma.custo.delete({ where: { id: custoId } });
  }

  /** Marca como paga/pendente ou ajusta valor e vencimento de uma parcela (edição manual) */
  async atualizarParcela(viagemId: string, parcelaId: string, dto: UpdateParcelaDto) {
    const parcela = await this.prisma.parcela.findFirst({
      where: { id: parcelaId, custo: { viagemId } },
    });
    if (!parcela) throw new NotFoundException('Parcela não encontrada.');

    const dados: Prisma.ParcelaUpdateInput = {};
    if (dto.paga === true) dados.pagaEm = dto.pagaEm ? paraData(dto.pagaEm) : hoje();
    if (dto.paga === false) {
      dados.pagaEm = null;
      dados.pagaComCofre = false;
    }
    if (dto.paga !== false && dto.pagaComCofre !== undefined) dados.pagaComCofre = dto.pagaComCofre;
    if (dto.valorCentavos !== undefined) dados.valorCentavos = dto.valorCentavos;
    if (dto.vencimento !== undefined) dados.vencimento = paraData(dto.vencimento);

    const custo = await this.prisma.$transaction(async (tx) => {
      await tx.parcela.update({ where: { id: parcelaId }, data: dados });
      const parcelas = await tx.parcela.findMany({ where: { custoId: parcela.custoId } });
      return tx.custo.update({
        where: { id: parcela.custoId },
        data: { valorTotalCentavos: somaDasParcelas(parcelas) },
        include: INCLUIR,
      });
    });
    return formatar(custo);
  }

  private montarParcelas(pagamento: PagamentoDto): ParcelaGerada[] {
    try {
      if (pagamento.modo === 'AUTOMATICO') {
        return gerarParcelas(
          pagamento.valorTotalCentavos!,
          pagamento.quantidadeParcelas!,
          paraData(pagamento.primeiroVencimento!),
        );
      }
      return normalizarParcelasManuais(
        pagamento.parcelas!.map((p) => ({ valorCentavos: p.valorCentavos, vencimento: paraData(p.vencimento) })),
      );
    } catch (erro) {
      throw new BadRequestException((erro as Error).message);
    }
  }

  private async buscar(viagemId: string, custoId: string) {
    const custo = await this.prisma.custo.findFirst({ where: { id: custoId, viagemId }, include: INCLUIR });
    if (!custo) throw new NotFoundException('Custo não encontrado.');
    return custo;
  }

  private async garantirParticipante(viagemId: string, participanteId: string) {
    const existe = await this.prisma.participante.findFirst({ where: { id: participanteId, viagemId } });
    if (!existe) throw new BadRequestException('Essa pessoa não participa da viagem.');
  }
}

function formatar(c: CustoCompleto) {
  const pagas = c.parcelas.filter((p) => p.pagaEm);
  return {
    id: c.id,
    nome: c.nome,
    categoria: c.categoria,
    observacao: c.observacao,
    valorTotalCentavos: c.valorTotalCentavos,
    pagoCentavos: somaDasParcelas(pagas),
    quitado: c.parcelas.length > 0 && pagas.length === c.parcelas.length,
    responsavel: c.responsavel ? { id: c.responsavel.id, nome: c.responsavel.usuario.nome } : null,
    parcelas: c.parcelas.map((p) => ({
      id: p.id,
      numero: p.numero,
      valorCentavos: p.valorCentavos,
      vencimento: paraIso(p.vencimento),
      pagaEm: p.pagaEm ? paraIso(p.pagaEm) : null,
      pagaComCofre: p.pagaComCofre,
    })),
  };
}
