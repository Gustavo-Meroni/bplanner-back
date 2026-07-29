// ATENÇÃO: Importando do @nestjs/swagger para a interface visual funcionar!
import { PartialType } from '@nestjs/swagger';
import { CreateDespesaDto } from './create-despesa.dto';

export class UpdateDespesaDto extends PartialType(CreateDespesaDto) {
    // O PartialType já faz a mágica de pegar tudo do CreateDespesaDto e colocar como opcional.
    // E mais importante: o Swagger também herda as descrições e exemplos!
}