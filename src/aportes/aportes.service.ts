import { Injectable } from '@nestjs/common';
import { CreateAporteDto } from './dto/create-aporte.dto';
import { UpdateAporteDto } from './dto/update-aporte.dto';

@Injectable()
export class AportesService {
  create(createAporteDto: CreateAporteDto) {
    return 'This action adds a new aporte';
  }

  findAll() {
    return `This action returns all aportes`;
  }

  findOne(id: number) {
    return `This action returns a #${id} aporte`;
  }

  update(id: number, updateAporteDto: UpdateAporteDto) {
    return `This action updates a #${id} aporte`;
  }

  remove(id: number) {
    return `This action removes a #${id} aporte`;
  }
}
