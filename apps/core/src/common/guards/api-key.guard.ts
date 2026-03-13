import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly validKeys = new Set([
    process.env.BACKOFFICE_API_KEY,
    process.env.INVESTORS_API_KEY,
  ]);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    const apiKey = request.headers['x-api-key'];

    if (!apiKey || !this.validKeys.has(apiKey)) {
      throw new UnauthorizedException('Invalid or missing API key');
    }

    return true;
  }
}