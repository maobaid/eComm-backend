import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const hasAuth = !!request.headers?.authorization;
    console.log('[JwtAuthGuard] canActivate', {
      method: request.method,
      path: request.path,
      hasAuthHeader: hasAuth,
    });
    return super.canActivate(context);
  }

  handleRequest<TUser>(err: Error | null, user: TUser | false, info: Error | null): TUser {
    if (err || !user) {
      const reason = err?.message ?? info?.message ?? (user === false ? 'token invalid or missing' : 'unknown');
      console.log('[JwtAuthGuard] DENY:', { reason, err: err?.message, info: info?.message });
      throw err ?? new UnauthorizedException(reason);
    }
    return user;
  }
}
