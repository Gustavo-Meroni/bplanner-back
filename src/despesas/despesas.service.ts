import { Injectable } from '@nestjs/common';
import { CreateDespesaDto } from './dto/create-despesa.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DespesasService {
  // Injetamos o PrismaService aqui no construtor
  constructor(private prisma: PrismaService) { }

  // Função para CRIAR uma despesa no banco
  async create(createDespesaDto: CreateDespesaDto) {
    return this.prisma.despesa.create({
      data: createDespesaDto,
    });
  }

  // Função para BUSCAR todas as despesas
  async findAll() {
    return this.prisma.despesa.findMany();
  }

  // Vamos deixar as outras vazias por enquanto, focaremos no Create e Read!
  findOne(id: number) {
    return `This action returns a #${id} despesa`;
  }
  update(id: number, updateDespesaDto: any) {
    return `This action updates a #${id} despesa`;
  }
  remove(id: number) {
    return `This action removes a #${id} despesa`;
  }
}