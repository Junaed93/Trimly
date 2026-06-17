import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { NotificationService } from '../notification/notification.service';

export interface Award {
  id: number;
  name: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_value: number;
  created_at: string;
}

export interface UserAward extends Award {
  earned_at: string;
}

@Injectable()
export class AwardService {
  constructor(
    private readonly db: DatabaseService,
    private readonly notificationService: NotificationService,
  ) {}

  async getAllAwards(): Promise<Award[]> {
    return this.db.query('SELECT * FROM awards ORDER BY id ASC');
  }

  async getUserAwards(userId: number): Promise<UserAward[]> {
    const query = `
      SELECT a.*, ua.earned_at
      FROM awards a
      JOIN user_awards ua ON a.id = ua.award_id
      WHERE ua.user_id = ?
      ORDER BY ua.earned_at DESC
    `;
    return this.db.query(query, [userId]);
  }

  async checkAndGrantAward(
    userId: number,
    requirementType: string,
    currentValue: number,
  ): Promise<void> {
    // Find all awards of this requirement type that the user hasn't earned yet
    // and where the current value meets or exceeds the requirement value
    const query = `
      SELECT a.* 
      FROM awards a
      LEFT JOIN user_awards ua ON a.id = ua.award_id AND ua.user_id = ?
      WHERE a.requirement_type = ? 
        AND a.requirement_value <= ?
        AND ua.id IS NULL
    `;
    const eligibleAwards = await this.db.query(query, [
      userId,
      requirementType,
      currentValue,
    ]);

    for (const award of eligibleAwards) {
      // Grant the award
      await this.db.query(
        'INSERT INTO user_awards (user_id, award_id) VALUES (?, ?)',
        [userId, award.id],
      );

      // Create notification
      await this.notificationService.createNotification(
        userId,
        'AWARD',
        `Achievement Unlocked: ${award.name}!`,
        award.description,
      );
    }
  }
}
