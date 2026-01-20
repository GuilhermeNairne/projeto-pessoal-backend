import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { UserInfoController } from './userInfo.controller';
import { UserInfoService } from './userInfo.service';

@Module({
  controllers: [UserInfoController],
  providers: [UserInfoService],
  imports: [PrismaModule],
})
export class UserInfoModule {}
