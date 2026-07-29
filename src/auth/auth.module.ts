import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    // Configuração do gerador de Tokens
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'bplanner-chave-secreta-em-desenvolvimento',
      signOptions: { expiresIn: '1d' }, // O token expira em 1 dia
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule { }