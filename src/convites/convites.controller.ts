import { Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Participante } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsuarioAtual, type UsuarioAutenticado } from '../common/usuario-atual.decorator';
import { ParticipanteAtual, ViagemGuard } from '../viagens/viagem.guard';
import { ConvitesService } from './convites.service';

@ApiTags('Convites')
@Controller()
export class ConvitesController {
  constructor(private readonly convites: ConvitesService) {}

  @Get('viagens/:viagemId/convite')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ViagemGuard)
  @ApiOperation({ summary: 'Link de convite da viagem (cria se não existir)' })
  obter(@Param('viagemId') viagemId: string, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.convites.obterOuCriar(viagemId, usuario.id);
  }

  @Post('viagens/:viagemId/convite')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ViagemGuard)
  @ApiOperation({ summary: 'Gerar um link novo e invalidar o anterior (só o dono)' })
  renovar(@Param('viagemId') viagemId: string, @ParticipanteAtual() participante: Participante) {
    return this.convites.renovar(viagemId, participante);
  }

  @Get('convites/:codigo')
  @ApiOperation({ summary: 'Prévia pública do convite (não precisa estar logado)' })
  previa(@Param('codigo') codigo: string) {
    return this.convites.previa(codigo);
  }

  @Post('convites/:codigo/aceitar')
  @HttpCode(200)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Entrar na viagem pelo convite' })
  aceitar(@Param('codigo') codigo: string, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.convites.aceitar(codigo, usuario.id);
  }
}
