import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

/**
 * Global guard that logs every request that reaches the guard phase.
 * Use only for debugging; remove or disable in production.
 */
@Injectable()
export class RequestLogGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    console.log('[RequestLogGuard]', request.method, request.url);
    return true;
  }
}
