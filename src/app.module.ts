import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { DespesasModule } from './despesas/despesas.module';
import { AportesModule } from './aportes/aportes.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [PrismaModule, DespesasModule, AportesModule, DashboardModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
