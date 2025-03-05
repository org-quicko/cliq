import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../services/user.service';
import { MemberService } from '../../services/member.service';
import { LoggerService } from '../../services/logger.service';

@Injectable()
export class UnifiedAuthGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private userService: UserService,
        private memberService: MemberService,
        private logger: LoggerService,
    ) { }

    async canActivate(context: ExecutionContext) {
        this.logger.info(`START: canActivate function- UnifiedAuthGuard guard`);

        const request = context.switchToHttp().getRequest();
        const authorization: string = request.headers.authorization;

        if (!authorization) {
            this.logger.error('Missing authentication token');
            throw new UnauthorizedException('Missing authentication token');
        }

        const token = authorization.split(' ')[1];
        if (!token) {
            this.logger.error('Invalid token format');
            throw new UnauthorizedException('Invalid token format');
        }

        try {
            const tokenPayload = await this.jwtService.verifyAsync(token);

            // Try authenticating as a user
            if (tokenPayload.aud === 'user') {
                const user = await this.userService.getUser(tokenPayload.sub as string);
                if (user) {
                    request.user = {
                        user_id: tokenPayload.sub,
                        email: tokenPayload.email,
                        role: tokenPayload.role,
                    };

                    this.logger.info(`END: canActivate function- UnifiedAuthGuard guard- authorized user`);
                    return true;
                }
            } else {
                // Try authenticating as a member
                const member = await this.memberService.getMember(tokenPayload.sub as string);
                if (member) {
                    request.member = {
                        member_id: tokenPayload.sub,
                        email: tokenPayload.email,
                    };

                    this.logger.info(`END: canActivate function- UnifiedAuthGuard guard- authorized member`);
                    return true;
                }
            }


            this.logger.error('Invalid credentials');
            throw new UnauthorizedException('Invalid credentials');
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw new UnauthorizedException('Authentication failed');
            } else {
                throw new Error('Authentication failed');
            }
        }
    }
}
