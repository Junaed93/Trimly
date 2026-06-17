import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AwardService } from '../award/award.service';

@Injectable()
export class ExerciseService {
  constructor(
    private db: DatabaseService,
    private awardService: AwardService,
  ) {}

  async createLog(userId: number, logData: any) {
    const query = `
      INSERT INTO exercise_logs 
      (user_id, exercise_id, exercise_name, met, duration_minutes, calories_burned, logged_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    const params = [
      userId,
      logData.exercise_id,
      logData.exercise_name || '', // Will get from DB ideally, but since we rely on client, we pass it or just fallback to empty string if not provided in payload though payload shouldn't have it ideally based on requirements, but wait requirements said POST /exercise/log just takes exercise_id and duration. We need the exercise name. But the database doesn't have exercises table. The dataset is on mobile. So we must pass exercise_name and met from mobile.
      logData.met || 0,
      logData.duration_minutes,
      logData.calories_burned,
    ];
    
    // Actually, let's just make the query match the mobile payload if it sends more fields. 
    // The requirement says:
    // POST /exercise/log { exercise_id: 5, duration_minutes: 30 }
    // If the backend has no exercises table, we must calculate calories on the frontend and send it, OR calculate it on the backend. 
    // Wait, the prompt says "calculate calories on the backend"? No, "Formula: Calories Burned = ...". 
    // But backend needs the MET value. Since backend has no exercises table, it can't calculate it unless it has the dataset. 
    // It's safer to have the frontend calculate it and send `calories_burned`, `exercise_name`, `met`, along with `exercise_id` and `duration_minutes` to the backend.
    
    const actualQuery = `
      INSERT INTO exercise_logs 
      (user_id, exercise_id, exercise_name, met, duration_minutes, calories_burned, logged_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    const actualParams = [
      userId,
      logData.exercise_id,
      logData.exercise_name || 'Exercise', 
      logData.met || 0,
      logData.duration_minutes,
      logData.calories_burned || 0,
    ];
    
    const result = await this.db.query(actualQuery, actualParams);
    
    // Check for awards
    const logsCountResult = await this.db.query(
      'SELECT COUNT(*) as count FROM exercise_logs WHERE user_id = ?',
      [userId]
    );
    const logCount = logsCountResult[0].count;
    await this.awardService.checkAndGrantAward(userId, 'EXERCISE_LOG', logCount);

    return { calories_burned: logData.calories_burned || 0 };
  }

  async getLogsByDate(userId: number, date: string) {
    const query = `
      SELECT * FROM exercise_logs
      WHERE user_id = ? AND DATE(logged_at) = ?
      ORDER BY id ASC
    `;
    const logs = await this.db.query(query, [userId, date]);
    const total_calories_burned = logs.reduce((sum: number, log: any) => sum + Number(log.calories_burned), 0);
    return {
      logs,
      total_calories_burned
    };
  }

  async getHistory(userId: number) {
    const query = `
      SELECT DATE(logged_at) as date, SUM(calories_burned) as total_calories_burned
      FROM exercise_logs
      WHERE user_id = ? AND logged_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(logged_at)
      ORDER BY DATE(logged_at) DESC
    `;
    return this.db.query(query, [userId]);
  }
}

