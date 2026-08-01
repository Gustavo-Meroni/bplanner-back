import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DespesasService {
  constructor(private prisma: PrismaService) { }

  async findAll(casalId: string, mes: string) {
    return this.prisma.perfil.findMany({
      where: { casalId },
      include: {
        categories: {
          include: {
            items: {
              where: { mes }, // Filtro mágico do mês
              orderBy: { createdAt: 'asc' }
            },
          },
        },
      },
    });
  }

  async createDespesa(data: any, casalId: string) {
    return this.prisma.despesa.create({
      data: {
        name: data.name,
        value: data.value,
        mes: data.mes,
        categoryId: data.categoryId,
        isFixa: data.isFixa || false,
        casalId: casalId,
      },
    });
  }

  async updateDespesa(id: string, data: any, casalId: string) {
    await this.checkDespesaOwnership(id, casalId);

    return this.prisma.despesa.update({
      where: { id },
      data: {
        name: data.name,
        value: data.value,
        isFixa: data.isFixa,
      },
    });
  }

  async toggleDespesa(id: string, checked: boolean, casalId: string) {
    await this.checkDespesaOwnership(id, casalId);

    return this.prisma.despesa.update({
      where: { id },
      data: { checked },
    });
  }

  async removeDespesa(id: string, casalId: string) {
    await this.checkDespesaOwnership(id, casalId);

    return this.prisma.despesa.delete({
      where: { id },
    });
  }

  async createCategoria(data: any) {
    return this.prisma.categoria.create({
      data: {
        name: data.name,
        perfilId: data.profileId,
      },
    });
  }

  async removeCategoria(id: string) {
    return this.prisma.categoria.delete({
      where: { id },
    });
  }

  private async checkDespesaOwnership(id: string, casalId: string) {
    const despesa = await this.prisma.despesa.findFirst({
      where: { id, casalId },
    });

    if (!despesa) {
      throw new NotFoundException('Despesa não encontrada ou não pertence ao seu casal!');
    }
    return despesa;
  }
}