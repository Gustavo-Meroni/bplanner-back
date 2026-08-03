import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateCategoriaDto {
    @ApiProperty({ example: 'Moradia', description: 'Nome da categoria' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'uuid-do-perfil', description: 'ID do perfil dono dessa categoria' })
    @IsString()
    @IsNotEmpty()
    profileId: string;
}