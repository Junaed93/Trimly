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
    const logsCountResult = await this.db.query(
      'SELECT COUNT(*) as count FROM daily_food_logs WHERE user_id = ?',
      [userId]
    );
    const logCount = logsCountResult[0].count;
    await this.awardService.checkAndGrantAward(userId, 'MEAL_LOG', logCount);

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
