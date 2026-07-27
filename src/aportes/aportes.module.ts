import { Module } from '@nestjs/common';
import { AportesService } from './aportes.service';
import { AportesController } from './aportes.controller';

@Module({
  controllers: [AportesController],
  providers: [AportesService],
})
export class AportesModule {}
