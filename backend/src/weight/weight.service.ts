import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { LogWeightDto } from './dto/log-weight.dto';

@Injectable()
export class WeightService {
  constructor(private db: DatabaseService) {}

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
