import { Module } from '@nestjs/common';
import { FoodController } from './food.controller';
import { FoodService } from './food.service';
import { DatabaseModule } from '../database/database.module';
import { AwardModule } from '../award/award.module';

@Module({
  imports: [DatabaseModule, AwardModule],
  controllers: [FoodController],
  providers: [FoodService],
})
export class FoodModule {}
