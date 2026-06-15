import { Controller, Post, Get, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('exercise')
@UseGuards(JwtAuthGuard)
export class ExerciseController {
  constructor(private readonly exerciseService: ExerciseService) {}

  @Post('log')
  async createLog(@Req() req: any, @Body() logData: any) {
    return this.exerciseService.createLog(req.user.id, logData);
  }

  @Get('today')
  async getTodayLogs(@Req() req: any) {
    const today = new Date().toISOString().split('T')[0];
    return this.exerciseService.getLogsByDate(req.user.id, today);
  }

  @Get('history')
  async getHistory(@Req() req: any) {
    return this.exerciseService.getHistory(req.user.id);
  }
}
