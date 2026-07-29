import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsNotEmpty, IsBoolean } from 'class-validator';

export class CreateDespesaDto {
    @ApiProperty({ example: 'Passagem Aérea', description: 'Descrição detalhada da despesa' })
    @IsString({ message: 'A descrição deve ser um texto' })
    @IsNotEmpty({ message: 'A descrição não pode estar vazia' })
    descricao: string;

    @ApiProperty({ example: 1500.50, description: 'Valor monetário da despesa' })
    @IsNumber({}, { message: 'O valor deve ser um número' })
    @IsNotEmpty({ message: 'O valor é obrigatório' })
    valor: number;

    @ApiProperty({ example: 'Julho', description: 'Mês de referência (ex: Janeiro, Fevereiro)' })
    @IsString()
    @IsNotEmpty({ message: 'O mês é obrigatório' })
    mes: string;

    @ApiProperty({ example: 'Gustavo', description: 'Quem pagou ou é responsável' })
    @IsString()
    @IsNotEmpty({ message: 'O responsável é obrigatório' })
    responsavel: string;

    @ApiPropertyOptional({ example: '15/07', description: 'Data de vencimento da conta' })
    @IsString()
    @IsOptional()
    vencimento?: string;

    @ApiPropertyOptional({ example: true, description: 'Status de pagamento da despesa' })
    @IsBoolean({ message: 'O campo isPaga deve ser um booleano (true ou false)' })
    @IsOptional()
    isPaga?: boolean;

    @ApiPropertyOptional({ example: true, description: 'Indica se é uma despesa fixa mensal' })
    @IsBoolean({ message: 'O campo isFixa deve ser um booleano (true ou false)' })
    @IsOptional()
    isFixa?: boolean;
}