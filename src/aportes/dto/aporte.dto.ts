import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateAporteDto {
  @ApiProperty({ example: 'Salário de novembro' })
  @IsString()
  @IsNotEmpty({ message: 'Descreva o aporte' })
  @MaxLength(120)
  descricao: string;

  @ApiProperty({ example: 150000, description: 'Valor em centavos' })
  @IsInt({ message: 'O valor deve estar em centavos (número inteiro)' })
  @Min(1, { message: 'O valor precisa ser maior que zero' })
  valorCentavos: number;

  @ApiProperty({ example: '2026-11-05' })
  @IsDateString({}, { message: 'Informe a data (AAAA-MM-DD)' })
  data: string;

  @ApiPropertyOptional({ description: 'Quem guardou. Padrão: quem está registrando' })
  @IsOptional()
  @IsUUID()
  participanteId?: string;
}

export class UpdateAporteDto extends PartialType(CreateAporteDto) {}
