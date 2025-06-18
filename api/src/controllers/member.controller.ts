import { Controller, Get, Post, Patch, Body, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { MemberService } from '../services/member.service';
import { CreateMemberDto, MemberExistsInProgramDto, SignUpMemberDto, UpdateMemberDto } from '../dtos';
import { LoggerService } from '../services/logger.service';
import { MemberAuthService } from '../services/memberAuth.service';
import { Permissions } from '../decorators/permissions.decorator';
import { Member } from '../entities';
import { Public } from 'src/decorators/public.decorator';

@ApiTags('Member')
@Controller('/programs/:program_id/members')
export class MemberController {
	constructor(
		private readonly memberService: MemberService,
		private memberAuthService: MemberAuthService,
		private logger: LoggerService,
	) { }

	/**
	 * Member sign up
	 */
	@ApiResponse({ status: 201, description: 'Created' })
	@Public()
	@Post('signup')
	async memberSignUp(
		@Param('program_id') programId: string,
		@Body() body: SignUpMemberDto,
	) {
		this.logger.info('START: memberSignUp controller');

		const result = await this.memberService.memberSignUp(programId, body);

		this.logger.info('END: memberSignUp controller');
		return { message: 'Successfully signed up member.', result };
	}

	/**
	 * Member log in
	 */
	@ApiResponse({ status: 200, description: 'OK' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@Public()
	@Post('login')
	async login(
		@Param('program_id') programId: string, 
		@Body() body: any,
	) {
		this.logger.info('START: login controller');

		const transformedBody = plainToInstance(CreateMemberDto, body);

		const result = await this.memberAuthService.authenticateMember(
			programId,
			{
				email: transformedBody.email,
				password: transformedBody.password,
			}
		);

		this.logger.info('END: login controller');
		return { message: 'Successfully logged in member.', result };
	}

	/**
	 * Get member
	 */
	@ApiResponse({ status: 200, description: 'OK' })
	@Permissions('read', Member)
	@Get(':member_id')
	async getMember(
		@Param('program_id') programId: string,
		@Param('member_id') memberId: string,
	) {
		this.logger.info('START: getMember controller');

		const result = await this.memberService.getMember(memberId);

		this.logger.info('END: getMember controller');
		return { message: 'Successfully fetched member.', result };
	}

	/**
	 * Update member info
	 */
	@ApiResponse({ status: 200, description: 'OK' })
	@ApiResponse({ status: 403, description: 'Forbidden' })
	@Permissions('update', Member)
	@Patch(':member_id')
	async updateMemberInfo(
		@Param('program_id') programId: string,
		@Param('member_id') memberId: string,
		@Body() body: UpdateMemberDto,
	) {
		this.logger.info('START: updateMemberInfo controller');

		const result = await this.memberService.updateMemberInfo(memberId, body);

		this.logger.info('END: updateMemberInfo controller');
		return { message: 'Successfully updated member information.', result };
	}

	@ApiResponse({ status: 204, description: 'No Content' })
	@ApiResponse({ status: 403, description: 'Forbidden' })
	@Permissions('delete', Member)
	@Delete(':member_id')
	async deleteUser(
		@Param('program_id') programId: string,
		@Param('member_id') memberId: string,
	) {
		this.logger.info('START: deleteUser controller');

		await this.memberService.deleteMember(memberId);

		this.logger.info('END: deleteUser controller');
		return { message: 'Successfully deleted member.' };
	}

	/**
	 * Check if member exists in a promoter inside a given program
	 */
	@ApiResponse({ status: 200, description: 'OK' })
	@Public()
	@Post('/exists')
	async memberExistsInProgram(
		@Param('program_id') programId: string,
		@Body() body: MemberExistsInProgramDto,
	) {
		this.logger.info('START: memberExistsInProgram controller');

		const result = await this.memberService.memberExistsInProgram(body.email, programId);

		this.logger.info('END: memberExistsInProgram controller');
		return { message: 'Successfully checked member existence in program.', result };
	}

	/**
	* Get promoter of member.
	* Given that a member can only be part of one promoter inside a given program (thus every member ID) is
	* associated with only one promoter.
	*/
	@ApiResponse({ status: 200, description: 'OK' })
	@Get(':member_id/promoter')
	async getPromoterOfMember(
		@Param('program_id') programId: string,
		@Param('member_id') memberId: string,
	) {
		this.logger.info('START: getPromoterOfMemberInProgram controller');

		const result = await this.memberService.getPromoterOfMember(programId, memberId);

		this.logger.info('END: getPromoterOfMemberInProgram controller');
		return { message: `Successfully fetched promoter of Member ${memberId}.`, result };
	}


}
