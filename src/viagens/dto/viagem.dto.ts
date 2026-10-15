import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsDefined,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class LocalDto {
  @ApiProperty({ example: 'Buenos Aires' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nome: string;

  @ApiProperty({ example: -34.6037 })
  @IsLatitude()
  lat: number;

  @ApiProperty({ example: -58.3816 })
  @IsLongitude()
  lng: number;
}

export class DestinoDto extends LocalDto {
  @ApiPropertyOptional({ example: 'Ciudad Autónoma de Buenos Aires' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  regiao?: string;

  @ApiPropertyOptional({ example: 'Argentina' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  pais?: string;

  @ApiPropertyOptional({ example: 'AR' })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  codigoPais?: string;
}

export class CreateViagemDto {
  @ApiPropertyOptional({ example: 'Buenos Aires no fim do ano', description: 'Padrão: nome do destino' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  nome?: string;

  @ApiProperty({ type: DestinoDto })
  @IsDefined({ message: 'Escolha o destino da viagem' })
  @ValidateNested()
  @Type(() => DestinoDto)
  destino: DestinoDto;

  @ApiPropertyOptional({ type: LocalDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalDto)
  origem?: LocalDto;

  @ApiProperty({ example: '2026-12-27' })
  @IsDateString({}, { message: 'Informe a data de ida (AAAA-MM-DD)' })
  dataIda: string;

  @ApiProperty({ example: '2027-01-03' })
  @IsDateString({}, { message: 'Informe a data de volta (AAAA-MM-DD)' })
  dataVolta: string;

  @ApiProperty({ example: 1250000, description: 'Meta em centavos' })
  @IsInt({ message: 'A meta deve estar em centavos (número inteiro)' })
  @Min(0)
  metaCentavos: number;

  @ApiPropertyOptional({ description: 'Detalhes da estimativa feita no onboarding' })
  @IsOptional()
  @IsObject()
  estimativa?: Record<string, unknown>;
}

export class UpdateViagemDto extends PartialType(CreateViagemDto) {}
