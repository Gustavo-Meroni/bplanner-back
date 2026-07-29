import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateCasalDto {
    @ApiProperty({ example: 'Nossa Casa 🏠', description: 'Novo nome do grupo/espaço do casal' })
    @IsString()
    @IsNotEmpty({ message: 'O nome do casal não pode estar vazio' })
    nome: string;
}