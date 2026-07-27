import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AportesService } from './aportes.service';
import { CreateAporteDto } from './dto/create-aporte.dto';
import { UpdateAporteDto } from './dto/update-aporte.dto';

@Controller('aportes')
export class AportesController {
  constructor(private readonly aportesService: AportesService) {}

  @Post()
  create(@Body() createAporteDto: CreateAporteDto) {
    return this.aportesService.create(createAporteDto);
  }

  @Get()
  findAll() {
    return this.aportesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.aportesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAporteDto: UpdateAporteDto) {
    return this.aportesService.update(+id, updateAporteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.aportesService.remove(+id);
  }
}
