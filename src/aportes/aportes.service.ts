import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAporteDto } from './dto/create-aporte.dto';
import { UpdateAporteDto } from './dto/update-aporte.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AportesService {
  constructor(private prisma: PrismaService) { }

  async create(createAporteDto: CreateAporteDto, casalId: string) {
    return this.prisma.aporte.create({
      data: {
        ...createAporteDto,
        casalId: casalId, // Amarra o aporte ao casal logado
      },
    });
  }

  async findAll(casalId: string) {
    return this.prisma.aporte.findMany({
      where: { casalId: casalId }, // Traz apenas os aportes do casal
    });
  }

  async findOne(id: string, casalId: string) {
    const aporte = await this.prisma.aporte.findFirst({
      where: {
        id: id,
        casalId: casalId, // Garante que o aporte pertence ao casal logado
      },
    });

    if (!aporte) {
      throw new NotFoundException('Aporte não encontrado ou não pertence ao seu casal!');
    }
    return aporte;
  }

  async update(id: string, updateAporteDto: UpdateAporteDto, casalId: string) {
    await this.findOne(id, casalId);

    return this.prisma.aporte.update({
      where: { id },
      data: updateAporteDto,
    });
  }

  async remove(id: string, casalId: string) {
    await this.findOne(id, casalId);

    return this.prisma.aporte.delete({
      where: { id },
    });
  }
}