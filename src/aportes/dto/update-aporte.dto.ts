import { PartialType } from '@nestjs/swagger';
import { CreateAporteDto } from './create-aporte.dto';

export class UpdateAporteDto extends PartialType(CreateAporteDto) { }