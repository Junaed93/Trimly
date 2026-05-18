import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WeightService } from './weight.service';
import { LogWeightDto } from './dto/log-weight.dto';

@Controller('weight')
@UseGuards(AuthGuard('jwt'))
export class WeightController {
  constructor(private readonly weightService: WeightService) {}

  @Post()
  async logWeight(@Req() req: any, @Body() dto: LogWeightDto) {
    const userId = req.user.id;
    return this.weightService.logWeight(userId, dto);
  }

  @Get()
  async getWeightLogs(@Req() req: any) {
    const userId = req.user.id;
    return this.weightService.getWeightLogs(userId);
  }
}
