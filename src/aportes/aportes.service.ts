import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Aporte, Participante } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paraData, paraIso } from '../common/datas';
import { CreateAporteDto, UpdateAporteDto } from './dto/aporte.dto';

@Injectable()
export class AportesService {
  constructor(private prisma: PrismaService) {}

  async listar(viagemId: string) {
    const aportes = await this.prisma.aporte.findMany({
      where: { viagemId },
      include: { participante: { include: { usuario: { select: { nome: true } } } } },
      orderBy: [{ data: 'desc' }, { createdAt: 'desc' }],
    });
    return aportes.map((a) => ({ ...formatar(a), quem: a.participante?.usuario.nome ?? null }));
  }

  async criar(viagemId: string, dto: CreateAporteDto, participante: Participante) {
    const participanteId = dto.participanteId ?? participante.id;
    await this.garantirParticipante(viagemId, participanteId);

    const aporte = await this.prisma.aporte.create({
      data: {
        viagemId,
        participanteId,
        descricao: dto.descricao.trim(),
        valorCentavos: dto.valorCentavos,
        data: paraData(dto.data),
      },
    });
    return formatar(aporte);
  }

  async atualizar(viagemId: string, aporteId: string, dto: UpdateAporteDto) {
    await this.buscar(viagemId, aporteId);
    if (dto.participanteId) await this.garantirParticipante(viagemId, dto.participanteId);

    const aporte = await this.prisma.aporte.update({
      where: { id: aporteId },
      data: {
        ...(dto.descricao !== undefined && { descricao: dto.descricao.trim() }),
        ...(dto.valorCentavos !== undefined && { valorCentavos: dto.valorCentavos }),
        ...(dto.data !== undefined && { data: paraData(dto.data) }),
        ...(dto.participanteId !== undefined && { participanteId: dto.participanteId }),
      },
    });
    return formatar(aporte);
  }

  async excluir(viagemId: string, aporteId: string) {
    await this.buscar(viagemId, aporteId);
    await this.prisma.aporte.delete({ where: { id: aporteId } });
  }

  private async buscar(viagemId: string, aporteId: string) {
    const aporte = await this.prisma.aporte.findFirst({ where: { id: aporteId, viagemId } });
    if (!aporte) throw new NotFoundException('Aporte não encontrado.');
    return aporte;
  }

  private async garantirParticipante(viagemId: string, participanteId: string) {
    const existe = await this.prisma.participante.findFirst({ where: { id: participanteId, viagemId } });
    if (!existe) throw new BadRequestException('Essa pessoa não participa da viagem.');
  }
}

function formatar(a: Aporte) {
  return {
    id: a.id,
    descricao: a.descricao,
    valorCentavos: a.valorCentavos,
    data: paraIso(a.data),
    participanteId: a.participanteId,
  };
}
