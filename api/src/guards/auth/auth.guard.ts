import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../services/user.service';
import { MemberService } from '../../services/member.service';
import { LoggerService } from '../../services/logger.service';
import { audienceEnum } from 'src/enums/audience.enum';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private userService: UserService,
        private memberService: MemberService,
        private logger: LoggerService,
    ) { }

    async canActivate(context: ExecutionContext) {
        this.logger.info(`START: canActivate function- AuthGuard guard`);

        const request: Request = context.switchToHttp().getRequest();
        const authorization = request.headers.authorization;

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
            if (tokenPayload.aud === audienceEnum.PROGRAM_USER) {
                const user = await this.userService.getUser(tokenPayload.sub as string);
                if (user) {
                    request.headers.user_id = user.userId;

                    this.logger.info(`END: canActivate function- AuthGuard guard- authenticated user`);
                    return true;
                }
            } else {
                // Try authenticating as a member
                const member = await this.memberService.getMember(tokenPayload.sub as string);
                if (member) {
                    request.headers.member_id = member.memberId;

                    this.logger.info(`END: canActivate function- AuthGuard guard- authenticated member`);
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
