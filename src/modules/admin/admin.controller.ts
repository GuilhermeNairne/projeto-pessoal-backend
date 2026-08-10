import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { AssignRoleDto, CreateRoleDto } from './dto/admin.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async listUsers() {
    return this.adminService.listUsers();
  }

  @Get('roles')
  async listRoles() {
    return this.adminService.listRoles();
  }

  @Post('roles')
  async createRole(@Body() body: CreateRoleDto) {
    return this.adminService.createRole(body);
  }

  @Patch('roles/:id')
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<CreateRoleDto>,
  ) {
    return this.adminService.updateRole(id, body);
  }

  @Delete('roles/:id')
  async deleteRole(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteRole(id);
  }

  @Post('users/:id/roles')
  async addRole(@Param('id') id: string, @Body() body: AssignRoleDto) {
    return this.adminService.addRole(id, body.roleId);
  }

  @Delete('users/:id/roles/:roleId')
  async removeRole(
    @Param('id') id: string,
    @Param('roleId', ParseIntPipe) roleId: number,
  ) {
    return this.adminService.removeRole(id, roleId);
  }
}
