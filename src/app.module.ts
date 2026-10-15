import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ViagensModule } from './viagens/viagens.module';
import { ConvitesModule } from './convites/convites.module';
import { AportesModule } from './aportes/aportes.module';
import { CustosModule } from './custos/custos.module';
import { DestinosModule } from './destinos/destinos.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ViagensModule,
    ConvitesModule,
    AportesModule,
    CustosModule,
    DestinosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
