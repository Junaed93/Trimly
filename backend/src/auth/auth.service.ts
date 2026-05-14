import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private db: DatabaseService,
    private jwtService: JwtService,
  ) {}

  private calculateCalories(
    weight: number,
    height: number,
    age: number,
    gender: string,
    goal: string,
  ): number {
    let bmr: number;
    if (gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }
    const tdee = bmr * 1.2;
    switch (goal) {
      case 'lose_slow':       return Math.round(tdee - 500);
      case 'lose_aggressive': return Math.round(tdee - 800);
      case 'gain':            return Math.round(tdee + 300);
      case 'maintain':
      default:                return Math.round(tdee);
    }
  }

  async register(dto: RegisterDto) {
    const existing = await this.db.query('SELECT id FROM users WHERE email = ?', [dto.email]);
    if (Array.isArray(existing) && existing.length > 0) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    await this.db.query(
      `INSERT INTO users (name, email, password_hash, provider) VALUES (?, ?, ?, 'local')`,
      [dto.name, dto.email, passwordHash],
    );
    return { message: 'User registered successfully' };
  }

  async login(dto: LoginDto) {
    const users = await this.db.query('SELECT * FROM users WHERE email = ?', [dto.email]);
    if (!Array.isArray(users) || users.length === 0) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const user = users[0];
    if (!user.password_hash) {
      throw new UnauthorizedException('This account uses Google Sign-In. Please use "Continue with Google".');
    }
    const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const payload = { sub: user.id, email: user.email };
    return { access_token: this.jwtService.sign(payload) };
  }

  async validateOAuthLogin(profile: {
    providerId: string;
    provider: string;
    email: string;
    name: string;
  }): Promise<{ access_token: string }> {
    const { providerId, provider, email, name } = profile;

    // Check if user already exists by email
    const existing = await this.db.query('SELECT * FROM users WHERE email = ?', [email]);

    let userId: number;

    if (Array.isArray(existing) && existing.length > 0) {
      const user = existing[0];
      userId = user.id;
      // Update provider info if they originally registered via local auth
      if (user.provider === 'local') {
        await this.db.query(
          'UPDATE users SET provider = ?, provider_id = ? WHERE id = ?',
          [provider, providerId, userId],
        );
      }
    } else {
      // Auto-register new OAuth user
      const result: any = await this.db.query(
        `INSERT INTO users (name, email, provider, provider_id) VALUES (?, ?, ?, ?)`,
        [name, email, provider, providerId],
      );
      userId = result.insertId;
    }

    const payload = { sub: userId, email };
    return { access_token: this.jwtService.sign(payload) };
  }

  async getProfile(userId: number) {
    const users = await this.db.query(
      'SELECT id, name, email, age, gender, height_cm, weight_kg, goal, daily_calorie_target, created_at, provider FROM users WHERE id = ?',
      [userId],
    );
    if (!Array.isArray(users) || users.length === 0) {
      throw new UnauthorizedException('User not found');
    }
    return users[0];
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const dailyCalorieTarget = this.calculateCalories(
      dto.weight_kg,
      dto.height_cm,
      dto.age,
      dto.gender,
      dto.goal,
    );
    await this.db.query(
      `UPDATE users SET age = ?, gender = ?, height_cm = ?, weight_kg = ?, goal = ?, daily_calorie_target = ? WHERE id = ?`,
      [dto.age, dto.gender, dto.height_cm, dto.weight_kg, dto.goal, dailyCalorieTarget, userId],
    );
    return { message: 'Profile updated successfully', daily_calorie_target: dailyCalorieTarget };
  }
}
