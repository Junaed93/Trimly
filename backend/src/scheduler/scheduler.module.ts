import { Module } from '@nestjs/common';
import { ReminderService } from './reminder.service';
import { DatabaseModule } from '../database/database.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [DatabaseModule, NotificationModule],
  providers: [ReminderService],
})
export class SchedulerModule {}
