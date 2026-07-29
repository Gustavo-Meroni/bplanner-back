import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUsuarioDto {
    @ApiProperty({ example: 'Gustavo', description: 'Nome do usuário' })
    @IsString({ message: 'O nome deve ser um texto válido.' })
    @IsNotEmpty({ message: 'O nome é obrigatório.' })
    nome: string;

    @ApiProperty({ example: 'gustavo@email.com', description: 'Email do usuário' })
    @IsEmail({}, { message: 'Informe um endereço de email válido.' })
    @IsNotEmpty({ message: 'O email é obrigatório.' })
    email: string;

    @ApiProperty({ example: 'senha123', description: 'Senha do usuário' })
    @IsString()
    @IsNotEmpty({ message: 'A senha é obrigatória.' })
    @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres.' })
    senha: string;
}