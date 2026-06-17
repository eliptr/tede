import {
  Injectable, ConflictException, UnauthorizedException,
  BadRequestException, OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from '../entities/user.entity';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async onModuleInit() {
    await this.seedAdmin();
  }

  private async seedAdmin() {
    const adminUsername = this.config.get('ADMIN_USERNAME', 'admin');
    const existing = await this.usersRepo.findOne({ where: { username: adminUsername } });
    if (!existing) {
      const password = this.config.get('ADMIN_PASSWORD', 'Admin1234!');
      const hash = await bcrypt.hash(password, 10);
      const admin = this.usersRepo.create({
        username: adminUsername,
        password_hash: hash,
        first_name: 'Admin',
        last_name: 'System',
        email: 'admin@ted2026.gr',
        phone: '0000000000',
        address: 'System',
        city: 'Athens',
        country: 'Greece',
        afm: '000000000',
        role: UserRole.ADMIN,
        status: UserStatus.APPROVED,
      });
      await this.usersRepo.save(admin);
      console.log(`Admin created: ${adminUsername}`);
    }
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersRepo.findOne({ where: { username: dto.username } });
    if (existing) throw new ConflictException('Username already in use');

    const emailExists = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (emailExists) throw new ConflictException('Email already in use');

    const hash = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepo.create({
      ...dto,
      password_hash: hash,
      role: UserRole.ATTENDEE,
      status: UserStatus.PENDING,
    });
    await this.usersRepo.save(user);
    return { message: 'Registration successful. Awaiting admin approval.' };
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepo.findOne({ where: { username: dto.username } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password_hash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (user.status === UserStatus.PENDING)
      throw new UnauthorizedException('Account pending admin approval');
    if (user.status === UserStatus.REJECTED)
      throw new UnauthorizedException('Account has been rejected');

    const payload = { sub: user.id, username: user.username, role: user.role };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      },
    };
  }

  async getProfile(userId: number) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    const { password_hash, ...safe } = user;
    return safe;
  }
}
