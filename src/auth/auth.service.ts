import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { UserRole } from './constants.js';
import type { JwtPayload } from './strategies/jwt.strategy.js';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  store_id: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<AuthUser | null> {
    const user = await this.findUserByEmail(email);
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return null;
    return this.toAuthUser(user);
  }

  async login(email: string, password: string): Promise<{ access_token: string; user: AuthUser }> {
    const user = await this.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Invalid email or password');
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      store_id: user.store_id ?? undefined,
    };
    const access_token = this.jwtService.sign(payload);
    return { access_token, user };
  }

  async register(data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    store_id?: string | null;
  }): Promise<AuthUser> {
    const existing = await this.findUserByEmail(data.email);
    if (existing) throw new UnauthorizedException('Email already registered');
    if (data.role === UserRole.SUPER_ADMIN && data.store_id != null) {
      throw new UnauthorizedException('SUPER_ADMIN must not have a store_id');
    }
    if (data.role !== UserRole.SUPER_ADMIN && !data.store_id) {
      throw new UnauthorizedException('STORE_ADMIN and STAFF must have a store_id');
    }
    const password_hash = await bcrypt.hash(data.password, 10);
    const user = await (this.prisma as any).user.create({
      data: {
        name: data.name,
        email: data.email,
        password_hash,
        role: data.role,
        store_id: data.store_id ?? null,
      },
    });
    return this.toAuthUser(user);
  }

  /**
   * Self-signup: create a store and its owner (STORE_ADMIN) in one transaction.
   * Use this when a new merchant wants to open a store.
   */
  async registerStore(data: {
    name: string;
    email: string;
    password: string;
    store_name: string;
    store_slug: string;
  }): Promise<{ user: AuthUser; store: { id: string; name: string; slug: string } }> {
    const email = data.email.trim().toLowerCase();
    const existingUser = await this.findUserByEmail(email);
    if (existingUser) throw new ConflictException('Email already registered');

    const existingSlug = await (this.prisma as any).store.findUnique({
      where: { slug: data.store_slug },
    });
    if (existingSlug) throw new ConflictException('Store slug already taken');

    const password_hash = await bcrypt.hash(data.password, 10);

    const result = await this.prisma.$transaction(async (tx: any) => {
      const store = await tx.store.create({
        data: {
          name: data.store_name,
          slug: data.store_slug,
          is_active: true,
        },
      });
      const user = await tx.user.create({
        data: {
          name: data.name,
          email,
          password_hash,
          role: UserRole.STORE_ADMIN,
          store_id: store.id,
        },
      });
      return { store, user };
    });

    return {
      user: this.toAuthUser(result.user),
      store: { id: result.store.id, name: result.store.name, slug: result.store.slug },
    };
  }

  async findUserById(id: string): Promise<AuthUser | null> {
    const user = await (this.prisma as any).user.findUnique({
      where: { id },
    });
    return user ? this.toAuthUser(user) : null;
  }

  private async findUserByEmail(email: string): Promise<any | null> {
    return (this.prisma as any).user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  private toAuthUser(row: { id: string; email: string; name: string; role: string; store_id: string | null }): AuthUser {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role as UserRole,
      store_id: row.store_id,
    };
  }
}
