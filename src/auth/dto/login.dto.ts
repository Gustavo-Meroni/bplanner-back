import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
    @ApiProperty({ example: 'gustavo@email.com', description: 'Email do usuário' })
    @IsEmail({}, { message: 'Informe um endereço de email válido.' })
    @IsNotEmpty({ message: 'O email é obrigatório.' })
    email: string;

    @ApiProperty({ example: 'senha123', description: 'Senha do usuário' })
    @IsString()
    @IsNotEmpty({ message: 'A senha é obrigatória.' })
    senha: string;
}