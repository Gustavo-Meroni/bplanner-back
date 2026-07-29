import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get('resumo')
    @ApiOperation({ summary: 'Retorna o balanço financeiro do casal, opcionalmente filtrado por mês' })
    @ApiQuery({ name: 'mes', required: false, example: '2026-07', description: 'Mês para filtrar (opcional)' })
    getResumo(@Req() req: any, @Query('mes') mes?: string) {
        const casalId = req.user?.casalId;
        return this.dashboardService.getResumo(casalId, mes);
    }
}