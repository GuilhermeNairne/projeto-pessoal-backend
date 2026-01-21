import { UserInfoService } from './userInfo.service';
import { Body, Controller, Get, Req, Res } from '@nestjs/common';

@Controller('user-info')
export class UserInfoController {
  constructor(private readonly userInfoService: UserInfoService) {}

  @Get()
  async getUserInfo(@Req() req) {
    const token = req.cookies.idToken;
    const response = await this.userInfoService.getUserInfo(token);

    return response;
  }
}
