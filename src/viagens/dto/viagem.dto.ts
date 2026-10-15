import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CategoriaCusto } from '@prisma/client';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsDateString,
  IsEnum,
  ValidateIf,
  Max,
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

export class OrigemDto extends LocalDto {
  @ApiPropertyOptional({ example: 'GRU', description: 'Código IATA do aeroporto' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  aeroporto?: string;
}

export class ParadaDto extends OrigemDto {
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

/** Como o valor do item se multiplica para virar o total */
export enum BaseDoCusto {
  FIXO = 'FIXO',
  POR_PESSOA = 'POR_PESSOA',
  POR_NOITE = 'POR_NOITE',
  POR_DIA = 'POR_DIA',
  POR_PESSOA_DIA = 'POR_PESSOA_DIA',
}

export enum SituacaoDoCusto {
  A_PAGAR = 'A_PAGAR',
  PAGO = 'PAGO',
  PARCELADO = 'PARCELADO',
}

/**
 * Item previsto no onboarding (passagem, hospedagem, passeios, gasto diário...).
 * Vira um Custo com parcelas: o que já foi pago fica fora da meta.
 */
export class ItemCustoDto {
  @ApiProperty({ example: 'Passagem ida e volta' })
  @IsString()
  @IsNotEmpty({ message: 'Dê um nome ao item' })
  @MaxLength(120)
  nome: string;

  @ApiPropertyOptional({ enum: CategoriaCusto, default: 'OUTROS' })
  @IsOptional()
  @IsEnum(CategoriaCusto)
  categoria?: CategoriaCusto;

  @ApiProperty({ example: 200000, description: 'Valor unitário em centavos' })
  @IsInt({ message: 'O valor deve estar em centavos (número inteiro)' })
  @Min(1, { message: 'O valor precisa ser maior que zero' })
  valorUnitarioCentavos: number;

  @ApiProperty({ enum: BaseDoCusto, example: BaseDoCusto.POR_PESSOA })
  @IsEnum(BaseDoCusto)
  base: BaseDoCusto;

  @ApiProperty({ enum: SituacaoDoCusto, example: SituacaoDoCusto.A_PAGAR })
  @IsEnum(SituacaoDoCusto)
  situacao: SituacaoDoCusto;

  @ApiPropertyOptional({ example: 10, description: 'Parcelas (só quando PARCELADO)' })
  @ValidateIf((o) => o.situacao === SituacaoDoCusto.PARCELADO)
  @IsInt()
  @Min(2, { message: 'Parcelado começa em 2 vezes' })
  @Max(48, { message: 'No máximo 48 parcelas' })
  parcelas?: number;

  @ApiPropertyOptional({ example: 3, description: 'Quantas já foram pagas' })
  @IsOptional()
  @IsInt()
  @Min(0)
  parcelasPagas?: number;

  @ApiPropertyOptional({ example: '2026-11-10', description: 'Vencimento da 1ª parcela' })
  @IsOptional()
  @IsDateString()
  primeiroVencimento?: string;
}

export class CreateViagemDto {
  @ApiPropertyOptional({ example: 'Buenos Aires no fim do ano', description: 'Padrão: nome do destino' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  nome?: string;

  @ApiProperty({ type: [ParadaDto], description: 'Destinos em ordem (1 a 8)' })
  @IsDefined({ message: 'Escolha o destino da viagem' })
  @ValidateNested({ each: true })
  @Type(() => ParadaDto)
  @ArrayMinSize(1, { message: 'Escolha pelo menos um destino' })
  @ArrayMaxSize(8, { message: 'No máximo 8 cidades por viagem' })
  paradas: ParadaDto[];

  @ApiPropertyOptional({ type: OrigemDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => OrigemDto)
  origem?: OrigemDto;

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

  @ApiPropertyOptional({ example: 2, description: 'Quantas pessoas vão (usado nos cálculos)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  pessoas?: number;

  @ApiPropertyOptional({ type: [ItemCustoDto], description: 'Itens previstos no onboarding' })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ItemCustoDto)
  @ArrayMaxSize(30)
  custos?: ItemCustoDto[];

  @ApiPropertyOptional({ description: 'Detalhes da estimativa feita no onboarding' })
  @IsOptional()
  @IsObject()
  estimativa?: Record<string, unknown>;
}

export class UpdateViagemDto extends PartialType(CreateViagemDto) {}
