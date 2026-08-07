import { Module } from '@nestjs/common';
import { FinancialService } from './financial.service';
import { FinancialController } from './financial.controller';
import { PayablesService } from './payables.service';
import { PayablesController } from './payables.controller';

@Module({
  controllers: [FinancialController, PayablesController],
  providers: [FinancialService, PayablesService],
  exports: [FinancialService, PayablesService],
})
export class FinancialModule {}
