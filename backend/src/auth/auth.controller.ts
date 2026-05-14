import { Body, Controller, Get, Post, Put, Request, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.id, dto);
  }

  // ── Google OAuth ──

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Request() req: any, @Res() res: Response) {
    // req.user is the result from GoogleStrategy.validate() → validateOAuthLogin()
    const { access_token } = req.user;
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:8082';
    // Redirect back to frontend with token in URL hash
    res.redirect(`${frontendUrl}/auth-callback?token=${access_token}`);
  }
}
