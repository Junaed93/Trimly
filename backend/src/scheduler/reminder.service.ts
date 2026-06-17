import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DatabaseService } from '../database/database.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly notificationService: NotificationService,
  ) {}

  // Run every day at 8 PM
  @Cron('0 20 * * *')
  async handleDailyReminders() {
    this.logger.log('Running daily reminder checks...');
    
    // Get all users
    const users = await this.db.query('SELECT id FROM users');
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate yesterday
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    for (const user of users) {
      const userId = user.id;

      // 1. Check Weight
      const weightLogsToday = await this.db.query(
        'SELECT id FROM weight_logs WHERE user_id = ? AND DATE(recorded_at) = ?',
        [userId, today]
      );
      
      if (weightLogsToday.length === 0) {
        // Did they log yesterday?
        const weightLogsYesterday = await this.db.query(
          'SELECT id FROM weight_logs WHERE user_id = ? AND DATE(recorded_at) = ?',
          [userId, yesterday]
        );
        
        let title = 'Time to log your weight!';
        let message = "Don't forget to step on the scale today.";
        
        if (weightLogsYesterday.length > 0) {
          title = 'Your streak is failing!';
          message = 'Go to the app and log your weight to keep your streak alive!';
        }
        
        await this.notificationService.createNotification(
          userId,
          'REMINDER',
          title,
          message
        );
      }

      // 2. Check Meals
      const mealLogsToday = await this.db.query(
        'SELECT id FROM daily_food_logs WHERE user_id = ? AND DATE(date) = ?',
        [userId, today]
      );

      if (mealLogsToday.length === 0) {
        await this.notificationService.createNotification(
          userId,
          'REMINDER',
          'Log your meals!',
          "You haven't logged any meals today. Stay on track!"
        );
      }
    }
    
    this.logger.log('Daily reminder checks completed.');
  }
}
