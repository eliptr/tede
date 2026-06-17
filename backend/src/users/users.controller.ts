import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard, RolesGuard, Roles } from '../auth/guards/auth.guards';
import { UserStatus, UserRole } from '../entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles('ADMIN')
  findAll(@Query('page') page: number, @Query('limit') limit: number) {
    return this.usersService.findAll(page, limit);
  }

  @Get('pending')
  @Roles('ADMIN')
  getPending() {
    return this.usersService.getPendingUsers();
  }

  @Get(':id')
  @Roles('ADMIN')
  findOne(@Param('id') id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id/status')
  @Roles('ADMIN')
  updateStatus(@Param('id') id: number, @Body('status') status: UserStatus) {
    return this.usersService.updateStatus(id, status);
  }

  @Patch(':id/role')
  @Roles('ADMIN')
  updateRole(@Param('id') id: number, @Body('role') role: UserRole) {
    return this.usersService.updateRole(id, role);
  }
}
