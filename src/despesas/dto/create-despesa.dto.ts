import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateDespesaDto {
    @ApiProperty({ example: 'Aluguel', description: 'Nome da despesa' })
    @IsString({ message: 'O nome deve ser um texto' })
    @IsNotEmpty({ message: 'O nome não pode estar vazio' })
    name: string;

    @ApiProperty({ example: 1500.50, description: 'Valor monetário da despesa' })
    @IsNumber({}, { message: 'O valor deve ser um número' })
    @IsNotEmpty({ message: 'O valor é obrigatório' })
    value: number;

    @ApiProperty({ example: 'Ago/2026', description: 'Mês de referência' })
    @IsString()
    @IsNotEmpty({ message: 'O mês é obrigatório' })
    mes: string;

    @ApiProperty({ example: 'uuid-da-categoria', description: 'ID da Categoria a qual pertence' })
    @IsString()
    @IsNotEmpty()
    categoryId: string;

    @ApiProperty({ example: 'uuid-do-perfil', description: 'ID do perfil' })
    @IsString()
    @IsNotEmpty()
    profileId: string;

    @ApiPropertyOptional({ example: true, description: 'Indica se é uma despesa fixa' })
    @IsBoolean()
    @IsOptional()
    isFixa?: boolean;
}