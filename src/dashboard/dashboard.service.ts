import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    async getResumoDoMes(mes: string) {
        // 1. Busca todas as despesas e aportes daquele mês específico
        const despesas = await this.prisma.despesa.findMany({ where: { mes } });
        const aportes = await this.prisma.aporte.findMany({ where: { mes } });

        // 2. Faz a matemática (soma tudo)
        const totalDespesas = despesas.reduce((acumulador, despesa) => acumulador + despesa.valor, 0);
        const totalAportes = aportes.reduce((acumulador, aporte) => acumulador + aporte.valor, 0);

        // 3. Calcula o saldo final
        const saldo = totalAportes - totalDespesas;

        // 4. Devolve o "prato feito" pro Front-end!
        return {
            mes,
            totalAportes,
            totalDespesas,
            saldo,
            balancoPositivo: saldo >= 0, // Um bônus para você pintar a tela de verde ou vermelho!
            detalhes: {
                aportes,
                despesas
            }
        };
    }
}