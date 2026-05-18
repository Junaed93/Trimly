import { Module } from '@nestjs/common';
import { WeightController } from './weight.controller';
import { WeightService } from './weight.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [WeightController],
  providers: [WeightService],
})
export class WeightModule {}
