import { BadRequestException, forwardRef, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';
import { User } from '../entities';
import { LoggerService } from './logger.service';
import { AuthInput, AuthResult } from '../interfaces/auth.interface';
import { audienceEnum } from 'src/enums/audience.enum';

@Injectable()
export class UserAuthService {
	constructor(
		@Inject(forwardRef(() => UserService))
		private userService: UserService,
		private jwtService: JwtService,
		private logger: LoggerService,
	) { }

	async authenticateUser(input: AuthInput): Promise<AuthResult> {
		this.logger.info(`START: authenticateUser service`);

		const user = await this.validateUser(input);
		const authResult = await this.loginUser(user);

		this.logger.info(`END: authenticateUser service`);
		return authResult;
	}

	async validateUser(input: AuthInput): Promise<User> {
		this.logger.info(`START: validateUser service`);

		const user = await this.userService.getUserByEmail(
			input.email.toLowerCase().trim(),
		);

		if (!user) {
			throw new UnauthorizedException(`Invalid Credentials!`);
		}

		const isPasswordValid = await this.comparePasswords(input.password, user.password);
		if (!isPasswordValid) {
			throw new UnauthorizedException(`Invalid Credentials!`);
		}

		this.logger.info(`END: validateUser service`);
		return user;
	}

	async loginUser(user: User): Promise<AuthResult> {
		this.logger.info(`START: loginUser service`);

		const tokenPayload = {
			sub: user.userId,
			email: user.email,
			aud: audienceEnum.PROGRAM_USER,
		};

		const accessToken = await this.jwtService.signAsync(tokenPayload);

		this.logger.info(`END: loginUser service`);
		return {
			access_token: accessToken,
		};
	}

	async comparePasswords(
		plainPassword: string,
		hashedPassword: string,
	): Promise<boolean> {
		return await bcrypt.compare(plainPassword, hashedPassword);
	}
}
