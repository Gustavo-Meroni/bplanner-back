import { NormalizarEmail } from '../../common/normalizar';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUsuarioDto {
  @ApiProperty({ example: 'Gustavo' })
  @IsString({ message: 'O nome deve ser um texto' })
  @IsNotEmpty({ message: 'O nome não pode estar vazio' })
  @MaxLength(60)
  nome: string;

  @ApiProperty({ example: 'gustavo@email.com' })
  @NormalizarEmail()
  @IsEmail({}, { message: 'Informe um email válido' })
  email: string;

  @ApiProperty({ example: 'senha123' })
  @IsString()
  @MinLength(6, { message: 'A senha precisa ter pelo menos 6 caracteres' })
  senha: string;
}
