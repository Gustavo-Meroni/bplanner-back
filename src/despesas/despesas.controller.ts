import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { DespesasService } from './despesas.service';
import { CreateDespesaDto } from './dto/create-despesa.dto';
import { UpdateDespesaDto } from './dto/update-despesa.dto';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Despesas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('despesas')
export class DespesasController {
  constructor(private readonly despesasService: DespesasService) { }

  // ==========================================
  // BUSCA CENTRAL
  // ==========================================
  @Get()
  @ApiOperation({ summary: 'Listar perfis, categorias e despesas do mês ativo' })
  @ApiQuery({ name: 'mes', required: true, example: 'Ago/2026' })
  findAll(@Query('mes') mes: string, @Req() req: any) {
    const casalId = req.user.casalId;
    return this.despesasService.findAll(casalId, mes);
  }

  // ==========================================
  // DESPESAS (ITENS)
  // ==========================================
  @Post()
  @ApiOperation({ summary: 'Criar uma nova despesa' })
  create(@Body() createDespesaDto: CreateDespesaDto, @Req() req: any) {
    const casalId = req.user.casalId;
    return this.despesasService.createDespesa(createDespesaDto, casalId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar nome ou valor de uma despesa' })
  update(@Param('id') id: string, @Body() updateDespesaDto: UpdateDespesaDto, @Req() req: any) {
    const casalId = req.user.casalId;
    return this.despesasService.updateDespesa(id, updateDespesaDto, casalId);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Marcar ou desmarcar despesa como paga' })
  toggle(@Param('id') id: string, @Body('checked') checked: boolean, @Req() req: any) {
    const casalId = req.user.casalId;
    return this.despesasService.toggleDespesa(id, checked, casalId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir uma despesa' })
  remove(@Param('id') id: string, @Req() req: any) {
    const casalId = req.user.casalId;
    return this.despesasService.removeDespesa(id, casalId);
  }

  // ==========================================
  // CATEGORIAS
  // ==========================================
  @Post('categorias')
  @ApiOperation({ summary: 'Criar uma nova categoria' })
  createCategoria(@Body() createCategoriaDto: CreateCategoriaDto) {
    return this.despesasService.createCategoria(createCategoriaDto);
  }

  @Delete('categorias/:id')
  @ApiOperation({ summary: 'Excluir uma categoria inteira (e suas despesas)' })
  removeCategoria(@Param('id') id: string) {
    return this.despesasService.removeCategoria(id);
  }
}