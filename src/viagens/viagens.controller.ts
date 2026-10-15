import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Participante } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsuarioAtual, type UsuarioAutenticado } from '../common/usuario-atual.decorator';
import { CreateViagemDto, UpdateViagemDto } from './dto/viagem.dto';
import { ParticipanteAtual, ViagemGuard } from './viagem.guard';
import { ViagensService } from './viagens.service';

@ApiTags('Viagens')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('viagens')
export class ViagensController {
  constructor(private readonly viagens: ViagensService) {}

  @Get()
  @ApiOperation({ summary: 'Minhas viagens' })
  listar(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.viagens.listar(usuario.id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar viagem (fim do onboarding)' })
  criar(@UsuarioAtual() usuario: UsuarioAutenticado, @Body() dto: CreateViagemDto) {
    return this.viagens.criar(usuario.id, dto);
  }

  @Get(':viagemId')
  @UseGuards(ViagemGuard)
  @ApiOperation({ summary: 'Detalhes da viagem e participantes' })
  detalhar(@Param('viagemId') viagemId: string, @ParticipanteAtual() participante: Participante) {
    return this.viagens.detalhar(viagemId, participante);
  }

  @Patch(':viagemId')
  @UseGuards(ViagemGuard)
  @ApiOperation({ summary: 'Atualizar destino, datas, meta ou nome' })
  atualizar(@Param('viagemId') viagemId: string, @Body() dto: UpdateViagemDto) {
    return this.viagens.atualizar(viagemId, dto);
  }

  @Delete(':viagemId')
  @HttpCode(204)
  @UseGuards(ViagemGuard)
  @ApiOperation({ summary: 'Excluir a viagem (só o dono)' })
  excluir(@Param('viagemId') viagemId: string, @ParticipanteAtual() participante: Participante) {
    return this.viagens.excluir(viagemId, participante);
  }

  @Get(':viagemId/resumo')
  @UseGuards(ViagemGuard)
  @ApiOperation({ summary: 'Números do painel: meta, progresso, cofre, custos e linha do tempo' })
  resumo(@Param('viagemId') viagemId: string) {
    return this.viagens.resumo(viagemId);
  }

  @Delete(':viagemId/participantes/:participanteId')
  @HttpCode(204)
  @UseGuards(ViagemGuard)
  @ApiOperation({ summary: 'Remover participante (dono) ou sair da viagem (o próprio)' })
  removerParticipante(
    @Param('viagemId') viagemId: string,
    @Param('participanteId') participanteId: string,
    @ParticipanteAtual() participante: Participante,
  ) {
    return this.viagens.removerParticipante(viagemId, participanteId, participante);
  }
}
