import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ViagemGuard } from '../viagens/viagem.guard';
import { CustosService } from './custos.service';
import { CreateCustoDto, PagamentoDto, UpdateCustoDto, UpdateParcelaDto } from './dto/custo.dto';

@ApiTags('Custos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ViagemGuard)
@Controller('viagens/:viagemId')
export class CustosController {
  constructor(private readonly custos: CustosService) {}

  @Get('custos')
  @ApiOperation({ summary: 'Custos da viagem com as parcelas' })
  listar(@Param('viagemId') viagemId: string) {
    return this.custos.listar(viagemId);
  }

  @Post('custos')
  @ApiOperation({ summary: 'Criar custo à vista, parcelado automático ou manual' })
  criar(@Param('viagemId') viagemId: string, @Body() dto: CreateCustoDto) {
    return this.custos.criar(viagemId, dto);
  }

  @Patch('custos/:custoId')
  @ApiOperation({ summary: 'Editar nome, categoria, observação ou responsável' })
  atualizar(@Param('viagemId') viagemId: string, @Param('custoId') custoId: string, @Body() dto: UpdateCustoDto) {
    return this.custos.atualizar(viagemId, custoId, dto);
  }

  @Put('custos/:custoId/parcelas')
  @ApiOperation({ summary: 'Refazer o parcelamento (só sem parcelas pagas)' })
  reparcelar(@Param('viagemId') viagemId: string, @Param('custoId') custoId: string, @Body() dto: PagamentoDto) {
    return this.custos.reparcelar(viagemId, custoId, dto);
  }

  @Delete('custos/:custoId')
  @HttpCode(204)
  excluir(@Param('viagemId') viagemId: string, @Param('custoId') custoId: string) {
    return this.custos.excluir(viagemId, custoId);
  }

  @Patch('parcelas/:parcelaId')
  @ApiOperation({ summary: 'Marcar parcela como paga/pendente ou ajustar valor e vencimento' })
  atualizarParcela(
    @Param('viagemId') viagemId: string,
    @Param('parcelaId') parcelaId: string,
    @Body() dto: UpdateParcelaDto,
  ) {
    return this.custos.atualizarParcela(viagemId, parcelaId, dto);
  }
}
