import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Participante } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ParticipanteAtual, ViagemGuard } from '../viagens/viagem.guard';
import { AportesService } from './aportes.service';
import { CreateAporteDto, UpdateAporteDto } from './dto/aporte.dto';

@ApiTags('Aportes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ViagemGuard)
@Controller('viagens/:viagemId/aportes')
export class AportesController {
  constructor(private readonly aportes: AportesService) {}

  @Get()
  @ApiOperation({ summary: 'Aportes da viagem (mais recentes primeiro)' })
  listar(@Param('viagemId') viagemId: string) {
    return this.aportes.listar(viagemId);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar dinheiro guardado' })
  criar(
    @Param('viagemId') viagemId: string,
    @Body() dto: CreateAporteDto,
    @ParticipanteAtual() participante: Participante,
  ) {
    return this.aportes.criar(viagemId, dto, participante);
  }

  @Patch(':aporteId')
  atualizar(@Param('viagemId') viagemId: string, @Param('aporteId') aporteId: string, @Body() dto: UpdateAporteDto) {
    return this.aportes.atualizar(viagemId, aporteId, dto);
  }

  @Delete(':aporteId')
  @HttpCode(204)
  excluir(@Param('viagemId') viagemId: string, @Param('aporteId') aporteId: string) {
    return this.aportes.excluir(viagemId, aporteId);
  }
}
