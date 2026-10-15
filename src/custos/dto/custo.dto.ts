import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsDefined,
  ArrayMinSize,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { CategoriaCusto } from '@prisma/client';

export class ParcelaManualDto {
  @ApiProperty({ example: 50000 })
  @IsInt()
  @Min(1)
  valorCentavos: number;

  @ApiProperty({ example: '2026-11-10' })
  @IsDateString()
  vencimento: string;
}

/**
 * Como o custo é pago.
 *  - AUTOMATICO: total + nº de parcelas + 1º vencimento → parcelas iguais, mês a mês
 *  - MANUAL: cada parcela com seu valor e vencimento (ex.: entrada maior)
 * À vista = AUTOMATICO com 1 parcela.
 */
export class PagamentoDto {
  @ApiProperty({ enum: ['AUTOMATICO', 'MANUAL'] })
  @IsIn(['AUTOMATICO', 'MANUAL'])
  modo: 'AUTOMATICO' | 'MANUAL';

  @ApiPropertyOptional({ example: 360000 })
  @ValidateIf((o) => o.modo === 'AUTOMATICO')
  @IsInt({ message: 'Informe o valor total em centavos' })
  @Min(1)
  valorTotalCentavos?: number;

  @ApiPropertyOptional({ example: 6 })
  @ValidateIf((o) => o.modo === 'AUTOMATICO')
  @IsInt()
  @Min(1)
  @Max(48, { message: 'No máximo 48 parcelas' })
  quantidadeParcelas?: number;

  @ApiPropertyOptional({ example: '2026-11-10' })
  @ValidateIf((o) => o.modo === 'AUTOMATICO')
  @IsDateString({}, { message: 'Informe o primeiro vencimento (AAAA-MM-DD)' })
  primeiroVencimento?: string;

  @ApiPropertyOptional({ type: [ParcelaManualDto] })
  @ValidateIf((o) => o.modo === 'MANUAL')
  @ValidateNested({ each: true })
  @Type(() => ParcelaManualDto)
  @ArrayMinSize(1, { message: 'Informe pelo menos uma parcela' })
  @ArrayMaxSize(48)
  parcelas?: ParcelaManualDto[];
}

export class CreateCustoDto {
  @ApiProperty({ example: 'Passagens GRU → EZE' })
  @IsString()
  @IsNotEmpty({ message: 'Dê um nome ao custo' })
  @MaxLength(120)
  nome: string;

  @ApiPropertyOptional({ enum: CategoriaCusto, default: 'OUTROS' })
  @IsOptional()
  @IsEnum(CategoriaCusto)
  categoria?: CategoriaCusto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacao?: string;

  @ApiPropertyOptional({ description: 'Participante responsável por pagar' })
  @IsOptional()
  @IsUUID()
  responsavelId?: string;

  @ApiProperty({ type: PagamentoDto })
  @IsDefined({ message: 'Informe como o custo é pago' })
  @ValidateNested()
  @Type(() => PagamentoDto)
  pagamento: PagamentoDto;
}

export class UpdateCustoDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nome?: string;

  @ApiPropertyOptional({ enum: CategoriaCusto })
  @IsOptional()
  @IsEnum(CategoriaCusto)
  categoria?: CategoriaCusto;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacao?: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'null remove o responsável' })
  @IsOptional()
  @IsUUID()
  responsavelId?: string | null;
}

export class UpdateParcelaDto {
  @ApiPropertyOptional({ description: 'Marcar como paga (true) ou pendente (false)' })
  @IsOptional()
  @IsBoolean()
  paga?: boolean;

  @ApiPropertyOptional({ description: 'Data do pagamento. Padrão: hoje' })
  @IsOptional()
  @IsDateString()
  pagaEm?: string;

  @ApiPropertyOptional({ description: 'Pago com o dinheiro do cofre?' })
  @IsOptional()
  @IsBoolean()
  pagaComCofre?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  valorCentavos?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  vencimento?: string;
}
