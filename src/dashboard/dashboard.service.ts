import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    async getResumo(casalId: string, mes?: string) {
        // 1. Monta as queries com base no casalId e mês opcional
        const queryDespesas: any = { casalId };
        const queryAportes: any = { casalId };

        if (mes) {
            queryDespesas.mes = mes;
            queryAportes.mes = mes;
        }

        // 2. Busca os dados
        const despesas = await this.prisma.despesa.findMany({ where: queryDespesas });
        const aportes = await this.prisma.aporte.findMany({ where: queryAportes });

        // 3. Faz a matemática
        const totalAportes = aportes.reduce((acc, aporte) => acc + aporte.valor, 0);
        const totalDespesas = despesas.reduce((acc, despesa) => acc + despesa.value, 0);

        const totalDespesasPagas = despesas
            .filter(d => d.checked)
            .reduce((acc, d) => acc + d.value, 0);

        const totalDespesasPendentes = despesas
            .filter(d => !d.checked)
            .reduce((acc, d) => acc + d.value, 0);

        const totalDespesasFixas = despesas
            .filter(d => d.isFixa)
            .reduce((acc, d) => acc + d.value, 0);

        const totalDespesasVariaveis = despesas
            .filter(d => !d.isFixa)
            .reduce((acc, d) => acc + d.value, 0);

        const saldo = totalAportes - totalDespesas;

        return {
            mes: mes || 'Todos',
            totalAportes,
            totalDespesas,
            totalDespesasPagas,
            totalDespesasPendentes,
            totalDespesasFixas,
            totalDespesasVariaveis,
            saldo,
            balancoPositivo: saldo >= 0,
            detalhes: {
                aportes,
                despesas
            }
        };
    }
}