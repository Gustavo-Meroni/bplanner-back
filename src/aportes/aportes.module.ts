import { Module } from '@nestjs/common';
import { AportesController } from './aportes.controller';
import { AportesService } from './aportes.service';

@Module({ controllers: [AportesController], providers: [AportesService] })
export class AportesModule {}
