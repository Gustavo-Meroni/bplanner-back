import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { DespesasService } from './despesas.service';
import { CreateDespesaDto } from './dto/create-despesa.dto';
import { UpdateDespesaDto } from './dto/update-despesa.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@ApiTags('Despesas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('despesas')
export class DespesasController {
  constructor(private readonly despesasService: DespesasService) { }

  @Post()
  @ApiOperation({ summary: 'Criar uma nova despesa' })
  create(@Body() createDespesaDto: CreateDespesaDto) {
    return this.despesasService.create(createDespesaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as despesas' })
  findAll() {
    return this.despesasService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar uma despesa específica pelo ID' })
  findOne(@Param('id') id: string) { // Note que aqui é id: string (sem o +)
    return this.despesasService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar dados de uma despesa' })
  update(@Param('id') id: string, @Body() updateDespesaDto: UpdateDespesaDto) {
    return this.despesasService.update(id, updateDespesaDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir uma despesa' })
  remove(@Param('id') id: string) {
    return this.despesasService.remove(id);
  }
}