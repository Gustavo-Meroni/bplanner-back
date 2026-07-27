import { Test, TestingModule } from '@nestjs/testing';
import { AportesService } from './aportes.service';

describe('AportesService', () => {
  let service: AportesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AportesService],
    }).compile();

    service = module.get<AportesService>(AportesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
