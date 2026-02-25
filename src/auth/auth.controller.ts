import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { RegisterStoreDto } from './dto/register-store.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { CurrentUser, type CurrentUserPayload } from './decorators/current-user.decorator.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Returns access token and user',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: { id: 'uuid', email: 'admin@store.com', name: 'Admin', role: 'SUPER_ADMIN', store_id: null },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email.trim().toLowerCase(), dto.password);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a user (any role)' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User created', schema: { example: { id: 'uuid', email: 'jane@store.com', name: 'Jane', role: 'STORE_ADMIN', store_id: 'store-uuid' } } })
  @ApiResponse({ status: 401, description: 'Email already registered or invalid role/store_id' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register({
      name: dto.name.trim(),
      email: dto.email.trim().toLowerCase(),
      password: dto.password,
      role: dto.role,
      store_id: dto.store_id ?? null,
    });
  }

  @Post('register-store')
  @ApiOperation({ summary: 'Create a store and its owner (STORE_ADMIN) in one step' })
  @ApiBody({ type: RegisterStoreDto })
  @ApiResponse({ status: 201, description: 'Store and owner created', schema: { example: { user: { id: 'uuid', email: 'jane@store.com', name: 'Jane', role: 'STORE_ADMIN', store_id: 'store-uuid' }, store: { id: 'store-uuid', name: "Jane's Shop", slug: 'janes-shop' } } } })
  @ApiResponse({ status: 409, description: 'Email or store slug already taken' })
  async registerStore(@Body() dto: RegisterStoreDto) {
    return this.authService.registerStore({
      name: dto.name.trim(),
      email: dto.email.trim().toLowerCase(),
      password: dto.password,
      store_name: dto.store_name.trim(),
      store_slug: dto.store_slug.trim(),
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get current user (requires Bearer token)' })
  @ApiOkResponse({ description: 'Current user', schema: { example: { id: 'uuid', email: 'admin@store.com', role: 'SUPER_ADMIN', store_id: null } } })
  me(@CurrentUser() user: CurrentUserPayload) {
    return user;
  }
}
