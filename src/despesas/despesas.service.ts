import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDespesaDto } from './dto/create-despesa.dto';
import { UpdateDespesaDto } from './dto/update-despesa.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DespesasService {
  constructor(private prisma: PrismaService) { }

  async create(createDespesaDto: CreateDespesaDto, casalId: string) {
    return this.prisma.despesa.create({
      data: {
        ...createDespesaDto,
        casalId: casalId, // Amarra a despesa ao casal
      },
    });
  }

  async findAll(casalId: string) {
    return this.prisma.despesa.findMany({
      where: { casalId: casalId }, // Traz todas as despesas do casal
    });
  }

  async findOne(id: string, casalId: string) {
    const despesa = await this.prisma.despesa.findFirst({
      where: {
        id: id,
        casalId: casalId, // Garante que a despesa pertence ao casal logado
      },
    });

    if (!despesa) {
      throw new NotFoundException('Despesa não encontrada ou não pertence ao seu casal!');
    }
    return despesa;
  }

  async update(id: string, updateDespesaDto: UpdateDespesaDto, casalId: string) {
    await this.findOne(id, casalId);

    return this.prisma.despesa.update({
      where: { id },
      data: updateDespesaDto,
    });
  }

  async remove(id: string, casalId: string) {
    await this.findOne(id, casalId);

    return this.prisma.despesa.delete({
      where: { id },
    });
  }
}