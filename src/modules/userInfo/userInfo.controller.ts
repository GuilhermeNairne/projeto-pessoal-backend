import { UserInfoService } from './userInfo.service';
import {
  Body,
  Controller,
  Get,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';

@Controller('user-info')
export class UserInfoController {
  constructor(private readonly userInfoService: UserInfoService) {}

  @Get()
  async getUserInfo(@Req() req) {
    const token =
      req.cookies?.idToken || req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('Token not provided');
    }

    const response = await this.userInfoService.getUserInfo(token);
    return response;
  }
}
