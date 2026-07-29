import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUsuarioDto {
    @ApiProperty({ example: 'Gustavo', description: 'Nome do usuário' })
    nome: string;

    @ApiProperty({ example: 'gustavo@email.com', description: 'Email do usuário' })
    email: string;

    @ApiProperty({ example: 'senha123', description: 'Senha do usuário' })
    senha: string;

    @ApiPropertyOptional({
        example: 'XY7A92',
        description: 'Código de convite caso esteja entrando no casal do parceiro. Deixe em branco para criar um novo casal.'
    })
    codigoConvite?: string;
}