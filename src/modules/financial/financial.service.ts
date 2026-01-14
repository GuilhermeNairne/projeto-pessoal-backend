import { Injectable } from '@nestjs/common';
import { PainelsDTO } from './dtos/painels.dto';

@Injectable()
export class FinancialService {
  constructor() {}

  async createPainel(body: PainelsDTO) {}
}
