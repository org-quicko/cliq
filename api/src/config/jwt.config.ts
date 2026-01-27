import { JwtModuleOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export const jwtConfig = (configService: ConfigService): JwtModuleOptions => ({
    secret: configService.get<string>('JWT_SECRET'),
    signOptions: {
        expiresIn: configService.get('JWT_EXPIRES_IN'),
    },
});