import { BadRequestException, forwardRef, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Member } from '../entities';
import { LoggerService } from './logger.service';
import { MemberService } from './member.service';
import { AuthInput, AuthResult, LoginData } from '../interfaces/auth.interface';
import { audienceEnum } from 'src/enums/audience.enum';

export interface MemberLoginData extends LoginData {
	member_id: string;
}

@Injectable()
export class MemberAuthService {
	constructor(
		@Inject(forwardRef(() => MemberService))
		private memberService: MemberService,
		private jwtService: JwtService,
		private logger: LoggerService,
	) {}

	async authenticateMember(programId: string, input: AuthInput): Promise<AuthResult> {
		this.logger.info(`START: authenticateMember service`);
		const [entity, errorMessage] = await this.validateMember(programId, input);

		if (!entity) {
			throw new UnauthorizedException({
				error: `Member does not exist.`,
				code: 401,
			});
		}

		const authResult = await this.loginMember(entity);

		this.logger.info(`END: authenticateMember service`);
		return authResult;
	}

	async validateMember(programId: string, input: AuthInput): Promise<[MemberLoginData | null, string]> {
		this.logger.info(`START: validateMember service`);
		
		let logInData: MemberLoginData | null;
		let errorMessage: string = '';

		const entity: Member | null = await this.memberService.getMemberByEmail(
			programId,
			input.email,
		);

		// const existsInAnyPromoter = await this.memberService.memberExistsInAnyPromoter(
		// 	input.email,
		// 	programId,
		// );

		// member isn't part of the program
		if (!entity) {
			logInData = null;
			errorMessage = `You are not registered in this program!`;
			throw new BadRequestException(errorMessage);
		} else {

			// member's part of the program but isn't part of any promoter
			// if (!existsInAnyPromoter) {
			// 	logInData = null;
			// 	errorMessage = `You are not part of any promoter in this program right now!`;
			// 	throw new BadRequestException(errorMessage);
			// } else {

				// incorrect password
				if (!(await this.comparePasswords(input.password, entity.password))) {
					logInData = null;
					errorMessage = `Invalid password! Please try again!`;
					throw new BadRequestException(errorMessage);
				} else {

					// valid member, allow login
					logInData = {
						member_id: entity.memberId,
						email: entity.email,
					};
				}

			// }
		}

		this.logger.info(`END: validateMember service`);
		return [logInData, errorMessage];
	}

	async loginMember(entity: MemberLoginData): Promise<AuthResult> {
		this.logger.info(`START: loginMember service`);

		const tokenPayload = {
			sub: entity.member_id,
			email: entity.email,
			aud: audienceEnum.PROMOTER_USER,
		};

		const accessToken = await this.jwtService.signAsync(tokenPayload);
		this.logger.info(`END: loginMember service`);
		return { access_token: accessToken };
	}

	async comparePasswords(
		plainPassword: string,
		hashedPassword: string,
	): Promise<boolean> {
		return await bcrypt.compare(plainPassword, hashedPassword);
	}
}
