import { ApiProperty } from '@nestjs/swagger';

export class CreateUsuarioDto {
    @ApiProperty({ example: 'Gustavo', description: 'Nome do usuário' })
    nome: string;

    @ApiProperty({ example: 'gustavo@email.com', description: 'Email do usuário' })
    email: string;

    @ApiProperty({ example: 'senha123', description: 'Senha do usuário' })
    senha: string;
}