import { Controller, Get, Param } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get('resumo/:mes')
    @ApiOperation({ summary: 'Retorna o balanço financeiro total de um mês' })
    @ApiParam({ name: 'mes', example: 'Julho', description: 'Nome do mês para filtrar' })
    getResumo(@Param('mes') mes: string) {
        return this.dashboardService.getResumoDoMes(mes);
    }
}