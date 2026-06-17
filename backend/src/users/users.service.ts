import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private usersRepo: Repository<User>) {}

  async findAll(page = 1, limit = 20) {
    const [users, total] = await this.usersRepo.findAndCount({
      select: ['id', 'username', 'first_name', 'last_name', 'email', 'phone', 'role', 'status', 'created_at'],
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
    });
    return { users, total, page, limit };
  }

  async findOne(id: number) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const { password_hash, ...safe } = user;
    return safe;
  }

  async updateStatus(id: number, status: UserStatus) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    user.status = status;
    await this.usersRepo.save(user);
    return { message: `User status updated to ${status}` };
  }

  async updateRole(id: number, role: UserRole) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    user.role = role;
    await this.usersRepo.save(user);
    return { message: `User role updated to ${role}` };
  }

  async getPendingUsers() {
    return this.usersRepo.find({
      where: { status: UserStatus.PENDING },
      select: ['id', 'username', 'first_name', 'last_name', 'email', 'phone', 'address', 'city', 'country', 'afm', 'created_at'],
      order: { created_at: 'DESC' },
    });
  }
}
