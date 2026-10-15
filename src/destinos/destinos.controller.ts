import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DestinosService } from './destinos.service';

@ApiTags('Destinos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('destinos')
export class DestinosController {
  constructor(private readonly destinos: DestinosService) {}

  @Get('busca')
  @ApiOperation({ summary: 'Buscar cidades pelo nome (com coordenadas para o mapa)' })
  @ApiQuery({ name: 'q', example: 'Buenos Aires' })
  buscar(@Query('q') q = '') {
    return this.destinos.buscar(q);
  }
}
