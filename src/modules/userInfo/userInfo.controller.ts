import { Body, Controller, Get, Req, Res } from '@nestjs/common';
import { UserInfoService } from './userInfo.service';

@Controller('user-info')
export class UserInfoController {
  constructor(private readonly userInfoService: UserInfoService) {}

  @Get()
  async getUserInfo(@Req() req) {
    const token = req.cookies.access_token;
    const response = await this.userInfoService.getUserInfo(token);

    return response;
  }
}
