import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAporteDto } from './dto/create-aporte.dto';
import { UpdateAporteDto } from './dto/update-aporte.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AportesService {
  constructor(private prisma: PrismaService) { }

  async create(createAporteDto: CreateAporteDto) {
    return this.prisma.aporte.create({ data: createAporteDto });
  }

  async findAll() {
    return this.prisma.aporte.findMany();
  }

  async findOne(id: string) {
    const aporte = await this.prisma.aporte.findUnique({
      where: { id },
    });

    if (!aporte) {
      throw new NotFoundException('Aporte não encontrado!');
    }
    return aporte;
  }

  async update(id: string, updateAporteDto: UpdateAporteDto) {
    await this.findOne(id); // Valida se existe

    return this.prisma.aporte.update({
      where: { id },
      data: updateAporteDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Valida se existe

    return this.prisma.aporte.delete({
      where: { id },
    });
  }
}