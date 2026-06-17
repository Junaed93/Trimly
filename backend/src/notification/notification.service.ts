import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

@Injectable()
export class NotificationService {
  constructor(private readonly db: DatabaseService) {}

  async getUserNotifications(userId: number): Promise<Notification[]> {
    return this.db.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [userId],
    );
  }

  async createNotification(
    userId: number,
    type: string,
    title: string,
    message: string,
  ): Promise<void> {
    await this.db.query(
      'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
      [userId, type, title, message],
    );
  }

  async markAsRead(notificationId: number, userId: number): Promise<void> {
    await this.db.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [notificationId, userId],
    );
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.db.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [userId],
    );
  }
}
