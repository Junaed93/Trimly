import { Module } from '@nestjs/common';
import { WeightController } from './weight.controller';
import { WeightService } from './weight.service';
import { DatabaseModule } from '../database/database.module';
import { AwardModule } from '../award/award.module';

@Module({
  imports: [DatabaseModule, AwardModule],
  controllers: [WeightController],
  providers: [WeightService],
})
export class WeightModule {}
