import { BadRequestException, Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
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
  @ApiOperation({ summary: 'Buscar lugares pelo nome: cidade ou bairro, com coordenadas' })
  @ApiQuery({ name: 'q', example: 'Palermo' })
  buscar(@Query('q') q = '') {
    return this.destinos.buscar(q);
  }


  @Get('paises/:codigo')
  @ApiOperation({ summary: 'Bandeira, moeda e idioma de um país (base local)' })
  pais(@Param('codigo') codigo: string) {
    return this.destinos.pais(codigo);
  }

  @Get('clima')
  @ApiOperation({ summary: 'Clima típico do mês num lugar (Open-Meteo)' })
  clima(@Query('lat') lat: string, @Query('lng') lng: string, @Query('mes', ParseIntPipe) mes: number) {
    return this.destinos.climaDoMes(coordenada(lat, 90), coordenada(lng, 180), mes);
  }

  @Get('feriados')
  @ApiOperation({ summary: 'Feriados nacionais no período (Nager.Date)' })
  @ApiQuery({ name: 'pais', example: 'AR' })
  @ApiQuery({ name: 'inicio', example: '2026-12-20' })
  @ApiQuery({ name: 'fim', example: '2027-01-05' })
  feriados(@Query('pais') pais: string, @Query('inicio') inicio: string, @Query('fim') fim: string) {
    return this.destinos.feriadosNoPeriodo(pais, inicio, fim);
  }

  @Get('cambio')
  @ApiOperation({ summary: 'Câmbio do dia (ExchangeRate-API, acesso aberto)' })
  @ApiQuery({ name: 'de', example: 'BRL' })
  @ApiQuery({ name: 'para', example: 'ARS' })
  cambio(@Query('de') de = 'BRL', @Query('para') para: string) {
    return this.destinos.cambio(de, para);
  }
}

function coordenada(valor: string, limite: number) {
  const n = Number(valor);
  if (!Number.isFinite(n) || Math.abs(n) > limite) throw new BadRequestException('Coordenada inválida.');
  return n;
}
