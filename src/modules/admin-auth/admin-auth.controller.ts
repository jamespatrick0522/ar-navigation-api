import {Body, Controller, Get, Post, Req, UseGuards} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {AdminAuthGuard} from './admin-auth.guard';
import {AdminAuthService} from './admin-auth.service';

@ApiTags('Admin Auth')
@Controller('auth/admin')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  login(@Body() body: {username?: string; password?: string}) {
    return this.adminAuthService.login(body.username ?? '', body.password ?? '');
  }

  @Get('me')
  @UseGuards(AdminAuthGuard)
  me(@Req() request: any) {
    return {admin: request.admin};
  }
}
