import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { LogWeightDto } from './dto/log-weight.dto';
import { AwardService } from '../award/award.service';

@Injectable()
export class WeightService {
  constructor(
    private db: DatabaseService,
    private awardService: AwardService,
  ) {}

  async logWeight(userId: number, dto: LogWeightDto) {
    try {
      // 1. Insert or update the weight log for the specific date
      await this.db.query(
        `INSERT INTO weight_logs (user_id, weight_kg, recorded_at) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE weight_kg = VALUES(weight_kg)`,
        [userId, dto.weight_kg, dto.date],
      );

      // 2. Update the main users table to keep profile in sync
      await this.db.query(
        `UPDATE users SET weight_kg = ? WHERE id = ?`,
        [dto.weight_kg, userId],
      );

      // 3. Check for awards
      // Get weight streak and log count
      const datesResult = await this.db.query(
        'SELECT DISTINCT DATE(recorded_at) as date FROM weight_logs WHERE user_id = ? ORDER BY date DESC',
        [userId]
      );
      const logCount = datesResult.length;
      
      let streak = 0;
      let lastDate = new Date();
      lastDate.setHours(0,0,0,0);
      
      for (let i = 0; i < datesResult.length; i++) {
        const logDate = new Date(datesResult[i].date);
        logDate.setHours(0,0,0,0);
        
        const diffDays = Math.floor((lastDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (i === 0 && diffDays > 1) {
           streak = 1; 
           break;
        } else if (i === 0) {
           streak = 1;
           lastDate = logDate;
        } else {
           if (diffDays === 1) {
              streak++;
              lastDate = logDate;
           } else {
              break;
           }
        }
      }

      await this.awardService.checkAndGrantAward(userId, 'WEIGHT_LOG', logCount);
      await this.awardService.checkAndGrantAward(userId, 'WEIGHT_STREAK', streak);


      return { message: 'Weight logged successfully' };
    } catch (error) {
      console.error('Weight log error:', error);
      throw new InternalServerErrorException('Failed to log weight: ' + error.message);
    }
  }

  async getWeightLogs(userId: number) {
    try {
      const logs = await this.db.query(
        `SELECT id, weight_kg, recorded_at 
         FROM weight_logs 
         WHERE user_id = ? 
         ORDER BY recorded_at DESC`,
        [userId],
      );
      return logs;
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch weight logs');
    }
  }
}
