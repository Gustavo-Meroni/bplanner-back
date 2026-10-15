import { Module } from '@nestjs/common';
import { ViagensController } from './viagens.controller';
import { ViagensService } from './viagens.service';
import { ViagemGuard } from './viagem.guard';

@Module({
  controllers: [ViagensController],
  providers: [ViagensService, ViagemGuard],
  exports: [ViagemGuard],
})
export class ViagensModule {}
