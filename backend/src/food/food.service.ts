import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AwardService } from '../award/award.service';

@Injectable()
export class FoodService {
  constructor(
    private db: DatabaseService,
    private awardService: AwardService,
  ) {}

  async createLog(userId: number, logData: any) {
    const query = `
      INSERT INTO daily_food_logs 
      (user_id, date, meal, food_name, quantity, unit, calories, protein_g, carbs_g, fat_g, time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      userId,
      logData.date,
      logData.meal,
      logData.food_name,
      logData.quantity,
      logData.unit,
      logData.calories,
      logData.protein_g,
      logData.carbs_g,
      logData.fat_g,
      logData.time,
    ];
    
    
    const result = await this.db.query(query, params);

    // Check for awards
    const datesResult = await this.db.query(
      'SELECT DISTINCT DATE(date) as date FROM daily_food_logs WHERE user_id = ? ORDER BY date DESC',
      [userId]
    );
    const logsResult = await this.db.query('SELECT COUNT(*) as count, SUM(calories) as totalCalories FROM daily_food_logs WHERE user_id = ?', [userId]);
    const logCount = logsResult[0].count;
    const totalCalories = logsResult[0].totalCalories || 0;

    let streak = 0;
    let lastDate = new Date();
    lastDate.setHours(0,0,0,0);
    
    for (let i = 0; i < datesResult.length; i++) {
      const logDate = new Date(datesResult[i].date);
      logDate.setHours(0,0,0,0);
      const diffDays = Math.floor((lastDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (i === 0 && diffDays > 1) {
         streak = 1; break;
      } else if (i === 0) {
         streak = 1; lastDate = logDate;
      } else {
         if (diffDays === 1) {
            streak++; lastDate = logDate;
         } else break;
      }
    }

    await this.awardService.checkAndGrantAward(userId, 'MEAL_LOG', logCount);
    await this.awardService.checkAndGrantAward(userId, 'MEAL_STREAK', streak);
    await this.awardService.checkAndGrantAward(userId, 'CALORIES_TRACKED', totalCalories);

    return { id: result.insertId, ...logData };
  }

  async getLogsByDate(userId: number, date: string) {
    const query = `
      SELECT * FROM daily_food_logs
      WHERE user_id = ? AND date = ?
      ORDER BY id ASC
    `;
    return this.db.query(query, [userId, date]);
  }

  async deleteLog(userId: number, logId: number) {
    const query = `DELETE FROM daily_food_logs WHERE id = ? AND user_id = ?`;
    await this.db.query(query, [logId, userId]);
    return { success: true };
  }
}
