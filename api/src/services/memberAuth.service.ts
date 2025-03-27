import { Injectable, UnauthorizedException } from '@nestjs/common';
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
		private memberService: MemberService,
		private jwtService: JwtService,
		private logger: LoggerService,
	) {}

	async authenticateMember(programId: string, input: AuthInput): Promise<AuthResult> {
		this.logger.info(`START: authenticateMember service`);
		const entity = await this.validateMember(programId, input);

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

	async validateMember(programId: string, input: AuthInput): Promise<MemberLoginData | null> {
		this.logger.info(`START: validateMember service`);

		const entity: Member | null = await this.memberService.getMemberByEmail(
			programId,
			input.email,
		);

		let logInData: MemberLoginData | null;
		if (
			entity &&
			(await this.comparePasswords(input.password, entity.password))
		) {
			logInData = {
				member_id: entity.memberId,
				email: entity.email,
			};
		} else logInData = null;

		this.logger.info(`END: validateMember service`);
		return logInData;
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

	private async comparePasswords(
		plainPassword: string,
		hashedPassword: string,
	): Promise<boolean> {
		return await bcrypt.compare(plainPassword, hashedPassword);
	}
}
