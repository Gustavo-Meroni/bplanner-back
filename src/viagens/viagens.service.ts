import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Participante, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateViagemDto, ParadaDto, UpdateViagemDto } from './dto/viagem.dto';
import { COM_PARADAS, resumirViagem } from './viagens.mapper';
import { itensParaCustos } from './itens-para-custos';
import { exigirDono } from './viagem.guard';
import { chaveDoMes, diasEntre, hoje, mesesAte, paraData, paraIso } from '../common/datas';

@Injectable()
export class ViagensService {
  constructor(private prisma: PrismaService) {}

  async listar(usuarioId: string) {
    const participacoes = await this.prisma.participante.findMany({
      where: { usuarioId },
      include: { viagem: { include: COM_PARADAS } },
      orderBy: { entrouEm: 'asc' },
    });
    return participacoes.map((p) => ({ ...resumirViagem(p.viagem), papel: p.papel }));
  }

  /** Cria a viagem no fim do onboarding; quem cria vira DONO */
  async criar(usuarioId: string, dto: CreateViagemDto) {
    this.validarDatas(dto.dataIda, dto.dataVolta);

    // Os itens previstos no onboarding já nascem como custos com parcelas
    const custos = itensParaCustos(dto.custos ?? [], {
      pessoas: dto.pessoas ?? 1,
      dataIda: paraData(dto.dataIda),
      dataVolta: paraData(dto.dataVolta),
    });

    const viagem = await this.prisma.viagem.create({
      data: {
        ...this.paraDados(dto),
        nome: dto.nome?.trim() || nomePadrao(dto.paradas),
        paradas: { create: this.paraParadas(dto.paradas) },
        participantes: { create: { usuarioId, papel: 'DONO' } },
        ...(custos.length > 0 && { custos: { create: custos } }),
      },
      include: { ...COM_PARADAS, participantes: true },
    });

    // "Já tenho guardado" vira o primeiro aporte, para o painel não nascer zerado
    if (dto.aporteInicialCentavos && dto.aporteInicialCentavos > 0) {
      await this.prisma.aporte.create({
        data: {
          viagemId: viagem.id,
          participanteId: viagem.participantes[0]?.id ?? null,
          descricao: 'Já guardado antes de começar',
          valorCentavos: dto.aporteInicialCentavos,
          data: hoje(),
        },
      });
    }

    return { ...resumirViagem(viagem), papel: 'DONO' as const };
  }

  async detalhar(viagemId: string, participante: Participante) {
    const viagem = await this.prisma.viagem.findUniqueOrThrow({
      where: { id: viagemId },
      include: {
        ...COM_PARADAS,
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

    const viagem = await this.prisma.$transaction(async (tx) => {
      if (dto.paradas) {
        // O roteiro é substituído inteiro (ordem nova, cidades novas)
        await tx.parada.deleteMany({ where: { viagemId } });
        await tx.parada.createMany({ data: this.paraParadas(dto.paradas).map((p) => ({ ...p, viagemId })) });
      }
      const nome = dto.nome?.trim() || (dto.paradas && !atual.nome.trim() ? nomePadrao(dto.paradas) : undefined);
      return tx.viagem.update({
        where: { id: viagemId },
        data: { ...this.paraDados(dto), ...(nome && { nome }) },
        include: COM_PARADAS,
      });
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
      this.prisma.viagem.findUniqueOrThrow({ where: { id: viagemId }, include: COM_PARADAS }),
      this.prisma.aporte.findMany({ where: { viagemId }, orderBy: { data: 'asc' } }),
      this.prisma.parcela.findMany({
        where: { custo: { viagemId } },
        include: { custo: { select: { id: true, nome: true, categoria: true } } },
        orderBy: [{ vencimento: 'asc' }, { numero: 'asc' }],
      }),
    ]);

    const guardado = soma(aportes.map((a) => a.valorCentavos));
    const pagas = parcelas.filter((p) => p.pagaEm);
    // O que já estava pago quando a viagem foi planejada não entra na meta nem no progresso
    const pagasNoPlano = pagas.filter((p) => !p.anteriorAoPlano);
    const pagoAntesDoPlano = soma(pagas.filter((p) => p.anteriorAoPlano).map((p) => p.valorCentavos));
    const pagoComCofre = soma(pagasNoPlano.filter((p) => p.pagaComCofre).map((p) => p.valorCentavos));
    const pagoForaDoCofre = soma(pagasNoPlano.filter((p) => !p.pagaComCofre).map((p) => p.valorCentavos));
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
        pagoCentavos: pagoComCofre + pagoForaDoCofre + pagoAntesDoPlano,
        pagoAntesDoPlanoCentavos: pagoAntesDoPlano,
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

  private paraParadas(paradas: ParadaDto[]) {
    return paradas.map((p, i) => ({
      ordem: i + 1,
      nome: p.nome.trim(),
      regiao: p.regiao ?? null,
      pais: p.pais ?? null,
      codigoPais: p.codigoPais?.toUpperCase() ?? null,
      lat: p.lat,
      lng: p.lng,
    }));
  }

  private paraDados(dto: UpdateViagemDto): Prisma.ViagemUpdateInput & Prisma.ViagemCreateInput {
    const dados: Record<string, unknown> = {};
    if (dto.origem) {
      Object.assign(dados, {
        origemNome: dto.origem.nome,
        origemLat: dto.origem.lat,
        origemLng: dto.origem.lng,
      });
    }
    if (dto.dataIda) dados.dataIda = paraData(dto.dataIda);
    if (dto.dataVolta) dados.dataVolta = paraData(dto.dataVolta);
    if (dto.metaCentavos !== undefined) dados.metaCentavos = dto.metaCentavos;
    if (dto.transporte !== undefined) dados.transporte = dto.transporte;
    if (dto.estimativa !== undefined) dados.estimativa = dto.estimativa as Prisma.InputJsonValue;
    return dados as Prisma.ViagemUpdateInput & Prisma.ViagemCreateInput;
  }
}

function nomePadrao(paradas: ParadaDto[]) {
  const nomes = paradas.map((p) => p.nome);
  return nomes.length <= 2 ? nomes.join(' e ') : `${nomes[0]} e mais ${nomes.length - 1} cidades`;
}

function soma(valores: number[]) {
  return valores.reduce((t, v) => t + v, 0);
}
