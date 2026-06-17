import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { AwardService } from './award.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('awards')
@UseGuards(JwtAuthGuard)
export class AwardController {
  constructor(private readonly awardService: AwardService) {}

  @Get()
  async getAllAwards() {
    return this.awardService.getAllAwards();
  }

  @Get('user')
  async getUserAwards(@Request() req) {
    return this.awardService.getUserAwards(req.user.id);
  }
}
