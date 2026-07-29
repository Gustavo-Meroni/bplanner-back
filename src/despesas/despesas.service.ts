import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDespesaDto } from './dto/create-despesa.dto';
import { UpdateDespesaDto } from './dto/update-despesa.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DespesasService {
  constructor(private prisma: PrismaService) { }

  async create(createDespesaDto: CreateDespesaDto) {
    return this.prisma.despesa.create({ data: createDespesaDto });
  }

  async findAll() {
    return this.prisma.despesa.findMany();
  }

  // BUSCAR POR ID
  async findOne(id: string) {
    const despesa = await this.prisma.despesa.findUnique({
      where: { id },
    });

    if (!despesa) {
      throw new NotFoundException('Despesa não encontrada!');
    }
    return despesa;
  }

  // ATUALIZAR
  async update(id: string, updateDespesaDto: UpdateDespesaDto) {
    await this.findOne(id); // Reutilizamos a função acima para garantir que existe!

    return this.prisma.despesa.update({
      where: { id },
      data: updateDespesaDto,
    });
  }

  // DELETAR
  async remove(id: string) {
    await this.findOne(id); // Garante que existe antes de tentar deletar

    return this.prisma.despesa.delete({
      where: { id },
    });
  }
}