import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Participante, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateViagemDto, UpdateViagemDto } from './dto/viagem.dto';
import { resumirViagem } from './viagens.mapper';
import { exigirDono } from './viagem.guard';
import { chaveDoMes, diasEntre, hoje, mesesAte, paraData, paraIso } from '../common/datas';

@Injectable()
export class ViagensService {
  constructor(private prisma: PrismaService) {}

  async listar(usuarioId: string) {
    const participacoes = await this.prisma.participante.findMany({
      where: { usuarioId },
      include: { viagem: true },
      orderBy: { entrouEm: 'asc' },
    });
    return participacoes.map((p) => ({ ...resumirViagem(p.viagem), papel: p.papel }));
  }

  /** Cria a viagem no fim do onboarding; quem cria vira DONO */
  async criar(usuarioId: string, dto: CreateViagemDto) {
    this.validarDatas(dto.dataIda, dto.dataVolta);

    const viagem = await this.prisma.viagem.create({
      data: {
        ...this.paraDados(dto),
        nome: dto.nome?.trim() || dto.destino.nome,
        participantes: { create: { usuarioId, papel: 'DONO' } },
      },
    });
    return { ...resumirViagem(viagem), papel: 'DONO' as const };
  }

  async detalhar(viagemId: string, participante: Participante) {
    const viagem = await this.prisma.viagem.findUniqueOrThrow({
      where: { id: viagemId },
      include: {
        participantes: {
          include: { usuario: { select: { id: true, nome: true, email: true } } },
          orderBy: { entrouEm: 'asc' },
        },
      },
    });

    return {
      ...resumirViagem(viagem),
      papel: participante.papel,
      participanteId: participante.id,
      participantes: viagem.participantes.map((p) => ({
        id: p.id,
        papel: p.papel,
        entrouEm: p.entrouEm,
        usuario: p.usuario,
      })),
    };
  }

  /** Também usado para completar o onboarding de viagens migradas (sem destino) */
  async atualizar(viagemId: string, dto: UpdateViagemDto) {
    const atual = await this.prisma.viagem.findUniqueOrThrow({ where: { id: viagemId } });
    const ida = dto.dataIda ?? (atual.dataIda ? paraIso(atual.dataIda) : undefined);
    const volta = dto.dataVolta ?? (atual.dataVolta ? paraIso(atual.dataVolta) : undefined);
    if (ida && volta) this.validarDatas(ida, volta);

    const viagem = await this.prisma.viagem.update({
      where: { id: viagemId },
      data: { ...this.paraDados(dto), ...(dto.nome !== undefined && { nome: dto.nome.trim() }) },
    });
    return resumirViagem(viagem);
  }

  async excluir(viagemId: string, participante: Participante) {
    exigirDono(participante);
    await this.prisma.viagem.delete({ where: { id: viagemId } });
  }

  /**
   * Remove um participante. O dono remove qualquer um; cada um pode sair sozinho.
   * Se o dono sai, o participante mais antigo vira dono; se era o último, a viagem é apagada.
   */
  async removerParticipante(viagemId: string, alvoId: string, quemPede: Participante) {
    const alvo = await this.prisma.participante.findFirst({ where: { id: alvoId, viagemId } });
    if (!alvo) throw new NotFoundException('Participante não encontrado.');

    const saindoSozinho = alvo.id === quemPede.id;
    if (!saindoSozinho && quemPede.papel !== 'DONO') {
      throw new ForbiddenException('Só quem criou a viagem pode remover participantes.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.participante.delete({ where: { id: alvo.id } });

      if (alvo.papel === 'DONO') {
        const proximo = await tx.participante.findFirst({ where: { viagemId }, orderBy: { entrouEm: 'asc' } });
        if (proximo) {
          await tx.participante.update({ where: { id: proximo.id }, data: { papel: 'DONO' } });
        } else {
          await tx.viagem.delete({ where: { id: viagemId } });
        }
      }
    });
  }

  /**
   * Números do painel. Regra do cofre:
   *  - progresso   = aportes + parcelas pagas por fora do cofre (dinheiro já garantido)
   *  - saldo cofre = aportes − parcelas pagas com o cofre
   */
  async resumo(viagemId: string) {
    const [viagem, aportes, parcelas] = await Promise.all([
      this.prisma.viagem.findUniqueOrThrow({ where: { id: viagemId } }),
      this.prisma.aporte.findMany({ where: { viagemId }, orderBy: { data: 'asc' } }),
      this.prisma.parcela.findMany({
        where: { custo: { viagemId } },
        include: { custo: { select: { id: true, nome: true, categoria: true } } },
        orderBy: [{ vencimento: 'asc' }, { numero: 'asc' }],
      }),
    ]);

    const guardado = soma(aportes.map((a) => a.valorCentavos));
    const pagas = parcelas.filter((p) => p.pagaEm);
    const pagoComCofre = soma(pagas.filter((p) => p.pagaComCofre).map((p) => p.valorCentavos));
    const pagoForaDoCofre = soma(pagas.filter((p) => !p.pagaComCofre).map((p) => p.valorCentavos));
    const comprometido = soma(parcelas.map((p) => p.valorCentavos));
    const progresso = guardado + pagoForaDoCofre;
    const falta = Math.max(viagem.metaCentavos - progresso, 0);

    const hojeData = hoje();
    const diasParaEmbarque = viagem.dataIda ? diasEntre(hojeData, viagem.dataIda) : null;
    const mesesRestantes = viagem.dataIda && diasParaEmbarque! > 0 ? mesesAte(hojeData, viagem.dataIda) : null;

    // Linha do tempo por mês: quanto entrou (aportes) e quanto vence (parcelas)
    const meses = new Map<string, { mes: string; aportesCentavos: number; parcelasCentavos: number }>();
    const mesDe = (chave: string) => {
      if (!meses.has(chave)) meses.set(chave, { mes: chave, aportesCentavos: 0, parcelasCentavos: 0 });
      return meses.get(chave)!;
    };
    aportes.forEach((a) => (mesDe(chaveDoMes(a.data)).aportesCentavos += a.valorCentavos));
    parcelas.forEach((p) => (mesDe(chaveDoMes(p.vencimento)).parcelasCentavos += p.valorCentavos));

    const pendentes = parcelas.filter((p) => !p.pagaEm);

    return {
      viagem: resumirViagem(viagem),
      metaCentavos: viagem.metaCentavos,
      guardadoCentavos: guardado,
      pagoForaDoCofreCentavos: pagoForaDoCofre,
      pagoComCofreCentavos: pagoComCofre,
      progressoCentavos: progresso,
      faltaCentavos: falta,
      percentual: viagem.metaCentavos > 0 ? Math.min(progresso / viagem.metaCentavos, 1) : 0,
      saldoCofreCentavos: guardado - pagoComCofre,
      custos: {
        comprometidoCentavos: comprometido,
        pagoCentavos: pagoComCofre + pagoForaDoCofre,
        pendenteCentavos: soma(pendentes.map((p) => p.valorCentavos)),
        atrasadas: pendentes.filter((p) => p.vencimento < hojeData).length,
      },
      diasParaEmbarque,
      sugestaoMensalCentavos: mesesRestantes ? Math.ceil(falta / mesesRestantes) : null,
      proximasParcelas: pendentes.slice(0, 5).map((p) => ({
        id: p.id,
        numero: p.numero,
        valorCentavos: p.valorCentavos,
        vencimento: paraIso(p.vencimento),
        custo: p.custo,
      })),
      porMes: [...meses.values()].sort((a, b) => a.mes.localeCompare(b.mes)),
    };
  }

  private validarDatas(ida: string, volta: string) {
    if (paraData(volta) < paraData(ida)) {
      throw new BadRequestException('A volta não pode ser antes da ida.');
    }
  }

  private paraDados(dto: UpdateViagemDto): Prisma.ViagemUpdateInput & Prisma.ViagemCreateInput {
    const dados: Record<string, unknown> = {};
    if (dto.destino) {
      Object.assign(dados, {
        destinoNome: dto.destino.nome,
        destinoRegiao: dto.destino.regiao ?? null,
        destinoPais: dto.destino.pais ?? null,
        destinoCodigoPais: dto.destino.codigoPais?.toUpperCase() ?? null,
        destinoLat: dto.destino.lat,
        destinoLng: dto.destino.lng,
      });
    }
    if (dto.origem) {
      Object.assign(dados, { origemNome: dto.origem.nome, origemLat: dto.origem.lat, origemLng: dto.origem.lng });
    }
    if (dto.dataIda) dados.dataIda = paraData(dto.dataIda);
    if (dto.dataVolta) dados.dataVolta = paraData(dto.dataVolta);
    if (dto.metaCentavos !== undefined) dados.metaCentavos = dto.metaCentavos;
    if (dto.estimativa !== undefined) dados.estimativa = dto.estimativa as Prisma.InputJsonValue;
    return dados as Prisma.ViagemUpdateInput & Prisma.ViagemCreateInput;
  }
}

function soma(valores: number[]) {
  return valores.reduce((t, v) => t + v, 0);
}
