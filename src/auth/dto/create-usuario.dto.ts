import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUsuarioDto {
    @ApiProperty({ example: 'Gustavo', description: 'Nome do usuário' })
    @IsString({ message: 'O nome deve ser um texto' })
    @IsNotEmpty({ message: 'O nome não pode estar vazio' })
    nome: string;

    @ApiProperty({ example: 'gustavo@email.com', description: 'Email do usuário' })
    @IsEmail({}, { message: 'Informe um email válido' })
    @IsNotEmpty({ message: 'O email é obrigatório' })
    email: string;

    @ApiProperty({ example: 'senha123', description: 'Senha do usuário' })
    @IsString()
    @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
    senha: string;

    @ApiPropertyOptional({
        example: 'XY7A92',
        description: 'Código de convite para entrar no casal do parceiro.'
    })
    @IsOptional()
    @IsString()
    codigoConvite?: string;

    @ApiPropertyOptional({ example: 'Casal Silva' })
    @IsOptional()
    @IsString()
    nomeCasal?: string;
}
