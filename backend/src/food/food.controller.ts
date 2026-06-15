import { Controller, Post, Get, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { FoodService } from './food.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('food-logs')
@UseGuards(JwtAuthGuard)
export class FoodController {
  constructor(private readonly foodService: FoodService) {}

  @Post()
  async createLog(@Req() req: any, @Body() logData: any) {
    return this.foodService.createLog(req.user.id, logData);
  }

  @Get(':date')
  async getLogsByDate(@Req() req: any, @Param('date') date: string) {
    return this.foodService.getLogsByDate(req.user.id, date);
  }

  @Delete(':id')
  async deleteLog(@Req() req: any, @Param('id') id: string) {
    return this.foodService.deleteLog(req.user.id, parseInt(id));
  }
}
