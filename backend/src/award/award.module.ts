import { Module, forwardRef } from '@nestjs/common';
import { AwardService } from './award.service';
import { AwardController } from './award.controller';
import { DatabaseModule } from '../database/database.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [DatabaseModule, forwardRef(() => NotificationModule)],
  providers: [AwardService],
  controllers: [AwardController],
  exports: [AwardService],
})
export class AwardModule {}
