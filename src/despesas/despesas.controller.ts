import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { DespesasService } from './despesas.service';
import { CreateDespesaDto } from './dto/create-despesa.dto';
import { UpdateDespesaDto } from './dto/update-despesa.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Despesas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('despesas')
export class DespesasController {
  constructor(private readonly despesasService: DespesasService) { }

  @Post()
  @ApiOperation({ summary: 'Criar uma nova despesa para o casal' })
  create(@Body() createDespesaDto: CreateDespesaDto, @Req() req: any) {
    const casalId = req.user.casalId;
    return this.despesasService.create(createDespesaDto, casalId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as despesas compartilhadas do casal' })
  findAll(@Req() req: any) {
    const casalId = req.user.casalId;
    return this.despesasService.findAll(casalId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar uma despesa específica pelo ID' })
  findOne(@Param('id') id: string, @Req() req: any) {
    const casalId = req.user.casalId;
    return this.despesasService.findOne(id, casalId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar dados de uma despesa do casal' })
  update(@Param('id') id: string, @Body() updateDespesaDto: UpdateDespesaDto, @Req() req: any) {
    const casalId = req.user.casalId;
    return this.despesasService.update(id, updateDespesaDto, casalId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir uma despesa do casal' })
  remove(@Param('id') id: string, @Req() req: any) {
    const casalId = req.user.casalId;
    return this.despesasService.remove(id, casalId);
  }
}