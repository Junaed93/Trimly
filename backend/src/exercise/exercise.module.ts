import { Module } from '@nestjs/common';
import { ExerciseController } from './exercise.controller';
import { ExerciseService } from './exercise.service';
import { DatabaseModule } from '../database/database.module';
import { AwardModule } from '../award/award.module';

@Module({
  imports: [DatabaseModule, AwardModule],
  controllers: [ExerciseController],
  providers: [ExerciseService],
})
export class ExerciseModule {}
