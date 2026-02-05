import { BadRequestException, forwardRef, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';
import { User } from '../entities';
import { LoggerService } from './logger.service';
import { AuthInput, AuthResult, LoginData } from '../interfaces/auth.interface';
import { audienceEnum } from 'src/enums/audience.enum';

export interface UserLoginData extends LoginData {
	user_id: string;
	first_name: string;
	last_name: string;
	role: string;
}

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
		const [entity, errorMessage] = await this.validateUser(input);

		if (!entity) {
			throw new UnauthorizedException({
				error: errorMessage,
				code: 401,
			});
		}

		const authResult = await this.loginUser(entity);

		this.logger.info(`END: authenticateUser service`);
		return authResult;
	}

	async validateUser(input: AuthInput): Promise<[UserLoginData | null, string]> {
		this.logger.info(`START: validateUser service`);

		const entity: User | null = await this.userService.getUserByEmail(
			input.email.toLowerCase().trim(),
		);

		let logInData: UserLoginData | null;
		let errorMessage: string = '';

		// user isn't part of the program
		if (!entity) {
			logInData = null;
			errorMessage = `User email isn't registered!`;
			throw new UnauthorizedException(errorMessage);

		} else {
			// incorrect password
			if (!(await this.comparePasswords(input.password, entity.password))) {
				logInData = null;
				errorMessage = `Invalid password! Please try again!`;
				throw new UnauthorizedException(errorMessage);
			} else {

				// valid member, allow login
				logInData = {
					user_id: entity.userId,
					email: entity.email,
					first_name: entity.firstName,
					last_name: entity.lastName,
					role: entity.role,
				};
			}
		}

		this.logger.info(`END: validateUser service`);
		return [logInData, errorMessage];
	}

	async loginUser(entity: UserLoginData): Promise<AuthResult> {
		this.logger.info(`START: loginUser service`);

		const tokenPayload = {
			sub: entity.user_id,
			email: entity.email,
			firstName: entity.first_name,
			lastName: entity.last_name,
			role: entity.role,
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
