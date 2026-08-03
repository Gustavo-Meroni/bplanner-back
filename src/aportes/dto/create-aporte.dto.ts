import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateAporteDto {
    @ApiProperty({ example: 'Salário', description: 'Origem da receita ou aporte' })
    @IsString({ message: 'A descrição deve ser um texto' })
    @IsNotEmpty({ message: 'A descrição não pode estar vazia' })
    descricao: string;

    @ApiProperty({ example: 5500.00, description: 'Valor monetário do aporte' })
    @IsNumber({}, { message: 'O valor deve ser um número' })
    @IsNotEmpty({ message: 'O valor é obrigatório' })
    valor: number;

    @ApiProperty({ example: 'Julho', description: 'Mês de referência' })
    @IsString()
    @IsNotEmpty({ message: 'O mês é obrigatório' })
    mes: string;
}