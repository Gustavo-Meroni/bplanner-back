import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Transforma esse módulo em global!
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Exporta o serviço para os outros módulos usarem
})
export class PrismaModule { }