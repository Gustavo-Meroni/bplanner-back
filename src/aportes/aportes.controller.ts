import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AportesService } from './aportes.service';
import { CreateAporteDto } from './dto/create-aporte.dto';
import { UpdateAporteDto } from './dto/update-aporte.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Aportes') // Agrupa lindamente no Swagger
@Controller('aportes')
export class AportesController {
  constructor(private readonly aportesService: AportesService) { }

  @Post()
  @ApiOperation({ summary: 'Criar um novo aporte (receita)' })
  create(@Body() createAporteDto: CreateAporteDto) {
    return this.aportesService.create(createAporteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os aportes' })
  findAll() {
    return this.aportesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um aporte específico pelo ID' })
  findOne(@Param('id') id: string) {
    return this.aportesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar dados de um aporte' })
  update(@Param('id') id: string, @Body() updateAporteDto: UpdateAporteDto) {
    return this.aportesService.update(id, updateAporteDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir um aporte' })
  remove(@Param('id') id: string) {
    return this.aportesService.remove(id);
  }
}