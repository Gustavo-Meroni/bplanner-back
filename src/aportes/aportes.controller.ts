import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { AportesService } from './aportes.service';
import { CreateAporteDto } from './dto/create-aporte.dto';
import { UpdateAporteDto } from './dto/update-aporte.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Import relativo padronizado

@ApiTags('Aportes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('aportes')
export class AportesController {
  constructor(private readonly aportesService: AportesService) { }

  @Post()
  @ApiOperation({ summary: 'Criar um novo aporte (receita) para o casal' })
  create(@Body() createAporteDto: CreateAporteDto, @Req() req: any) {
    const casalId = req.user.casalId;
    return this.aportesService.create(createAporteDto, casalId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os aportes compartilhados do casal' })
  findAll(@Req() req: any) {
    const casalId = req.user.casalId;
    return this.aportesService.findAll(casalId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um aporte específico pelo ID' })
  findOne(@Param('id') id: string, @Req() req: any) {
    const casalId = req.user.casalId;
    return this.aportesService.findOne(id, casalId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar dados de um aporte do casal' })
  update(@Param('id') id: string, @Body() updateAporteDto: UpdateAporteDto, @Req() req: any) {
    const casalId = req.user.casalId;
    return this.aportesService.update(id, updateAporteDto, casalId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir um aporte do casal' })
  remove(@Param('id') id: string, @Req() req: any) {
    const casalId = req.user.casalId;
    return this.aportesService.remove(id, casalId);
  }
}