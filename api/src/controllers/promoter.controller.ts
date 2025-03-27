import { Controller, Get, Post, Delete, Patch, Body, Param, Query, Res, UseGuards, Req, Headers, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { PromoterService } from '../services/promoter.service';
import {
	CreatePromoterDto,
	InviteMemberDto,
	UpdatePromoterMemberDto,
} from '../dtos';
import { SkipTransform } from '../decorators/skipTransform.decorator';
import { roleEnum, statusEnum, conversionTypeEnum } from '../enums';
import { LoggerService } from '../services/logger.service';
import { AuthGuard } from '../guards/auth.guard';
import { Permissions } from '../decorators/permissions.decorator';
import {
	Commission,
	Promoter,
	PromoterMember,
	Purchase,
	ReferralView,
	PromoterStatsView,
	SignUp,
	Link,
} from '../entities';
import { PermissionsGuard } from '../guards/permissions.guard';
import { sortOrderEnum } from 'src/enums/sortOrder.enum';
import { referralSortByEnum } from 'src/enums/referralSortBy.enum';
import { reportPeriodEnum } from 'src/enums/reportPeriod.enum';
import { getReportFileName, getStartEndDate } from 'src/utils';
import { SkipPermissions } from 'src/decorators/skipPermissions.decorator';

@ApiTags('Promoter')
@UseGuards(AuthGuard, PermissionsGuard)
@Controller('/programs/:program_id/promoters')
export class PromoterController {
	constructor(
		private readonly promoterService: PromoterService,
		private logger: LoggerService,
	) { }

	/**
	 * Create promoter
	 */
	@ApiResponse({ status: 201, description: 'Created' })
	@Post()
	async createPromoter(
		@Req() req: Request,
		@Param('program_id') programId: string,
		@Body() body: CreatePromoterDto,
	) {
		this.logger.info('START: createPromoter controller');

		const memberId = req.headers.member_id as string;
		const result = await this.promoterService.createPromoter(
			memberId,
			programId,
			body,
		);

		this.logger.info('END: createPromoter controller');
		return { message: 'Successfully created promoter.', result };
	}

	/**
	 * Get promoter
	 */
	@ApiResponse({ status: 200, description: 'OK' })
	@Permissions('read', Promoter)
	@Get(':promoter_id')
	async getPromoter(@Param('promoter_id') promoterId: string) {
		this.logger.info('START: getPromoter controller');

		const result = await this.promoterService.getPromoter(promoterId);

		this.logger.info(`END: getPromoter controller`);
		return { message: 'Successfully fetched promoter.', result };
	}

	/**
	 * Invite member
	 */
	@ApiResponse({ status: 201, description: 'Created' })
	@Permissions('invite_member', Promoter)
	@Post(':promoter_id/members')
	async inviteMember(
		@Param('program_id') programId: string,
		@Param('promoter_id') promoterId: string,
		@Body() body: InviteMemberDto,
	) {
		this.logger.info('START: inviteMember controller');

		const result = await this.promoterService.inviteMember(
			programId,
			promoterId,
			body,
		);

		this.logger.info('END: inviteMember controller');
		return { message: 'Successfully invited member to promoter.', result };
	}

	/**
	 * Get all members
	 */
	@ApiResponse({ status: 200, description: 'OK' })
	@SkipTransform()
	@Permissions('read_all', PromoterMember)
	@Get(':promoter_id/members')
	async getAllMembers(
		@Headers('x-accept-type') acceptType: string,
		@Param('program_id') programId: string,
		@Param('promoter_id') promoterId: string,
		@Query('role') role: roleEnum,
		@Query('email') email: string,
		@Query('status') status: statusEnum,
		@Query('skip') skip: number = 0,
		@Query('take') take: number = 10,
	) {
		this.logger.info('START: getAllMembers controller');

		const toUseSheetJsonFormat = (acceptType === 'application/json;format=sheet-json');

		const result = await this.promoterService.getAllMembers(
			promoterId,
			toUseSheetJsonFormat,
			{
				role,
				status,
			},
			{
				skip,
				take,
			}
		);

		this.logger.info('END: getAllMembers controller');
		return { message: 'Successfully fetched members of promoter.', result };
	}

	/**
	 * Update role
	 */
	@ApiResponse({ status: 204, description: 'No Content' })
	@ApiResponse({ status: 403, description: 'Forbidden' })
	@Permissions('change_role', PromoterMember)
	@Patch(':promoter_id/members/:member_id')
	async updateRole(
		@Param('member_id') memberId: string,
		@Body() body: UpdatePromoterMemberDto,
	) {
		this.logger.info('START: updateRole controller');

		await this.promoterService.updateRole(memberId, body);

		this.logger.info('END: updateRole controller');
		return { message: 'Successfully updated role of member.' };
	}

	/**
	 * Remove member
	 */
	@ApiResponse({ status: 204, description: 'No Content' })
	@ApiResponse({ status: 403, description: 'Forbidden' })
	@Permissions('remove_member', PromoterMember)
	@Delete(':promoter_id/members/:member_id')
	async removeMember(
		@Param('promoter_id') promoterId: string,
		@Param('member_id') memberId: string,
	) {
		this.logger.info('START: removeMember controller');

		await this.promoterService.removeMember(promoterId, memberId);

		this.logger.info('END: removeMember controller');
		return { message: 'Successfully removed member from promoter.' };
	}

	/**
	 * Get signups for promoter
	 */
	@ApiResponse({ status: 200, description: 'OK' })
	@Permissions('read', SignUp)
	@Get(':promoter_id/signups')
	async getSignUpsForPromoter(
		@Headers('x-accept-type') acceptType: string,
		@Param('program_id') programId: string,
		@Param('promoter_id') promoterId: string,
		@Query('skip') skip: number = 0,
		@Query('take') take: number = 10,
	) {
		this.logger.info('START: getSignUpsForPromoter controller');

		const toUseSheetJsonFormat = (acceptType === 'application/json;format=sheet-json');

		const result = await this.promoterService.getSignUpsForPromoter(
			programId,
			promoterId,
			toUseSheetJsonFormat,
			{},
			{
				skip,
				take,
			},
		);

		this.logger.info('END: getSignUpsForPromoter controller');
		return {
			message: 'Successfully fetched all signups of promoter.',
			result,
		};
	}

	/**
	 * Get purchases for promoter
	 */
	@ApiResponse({ status: 200, description: 'OK' })
	@Permissions('read', Purchase)
	@Get(':promoter_id/purchases')
	async getPurchasesForPromoter(
		@Headers('x-accept-type') acceptType: string,
		@Param('program_id') programId: string,
		@Param('promoter_id') promoterId: string,
		@Query('item_id') itemId?: string,
		@Query('skip') skip: number = 0,
		@Query('take') take: number = 10,
	) {
		this.logger.info('START: getPurchasesForPromoter controller');

		const toUseSheetJsonFormat = (acceptType === 'application/json;format=sheet-json');

		const result = await this.promoterService.getPurchasesForPromoter(
			programId,
			promoterId,
			toUseSheetJsonFormat,
			{
				...(itemId && { itemId }),
			},
			{
				skip,
				take,
			},
		);

		this.logger.info('END: getPurchasesForPromoter controller');
		return {
			message: 'Successfully fetched all purchases of promoter.',
			result,
		};
	}

	/**
	 * Get promoter referrals, for a program
	 */
	@ApiResponse({ status: 201, description: 'OK' })
	@ApiResponse({ status: 400, description: 'Bad Request' })
	@Permissions('read', ReferralView)
	@Get(':promoter_id/referrals')
	async getPromoterReferrals(
		@Headers('x-accept-type') acceptType: string,
		@Param('program_id') programId: string,
		@Param('promoter_id') promoterId: string,
		@Query('sort_by') sortBy: referralSortByEnum = referralSortByEnum.UPDATED_AT,
		@Query('sort_order') sortOrder: sortOrderEnum = sortOrderEnum.DESCENDING, // latest first
	) {
		this.logger.info('START: getPromoterReferrals controller');

		const toUseSheetJsonFormat = (acceptType === 'application/json;format=sheet-json');

		const result = await this.promoterService.getPromoterReferrals(
			programId,
			promoterId,
			sortBy,
			sortOrder,
			toUseSheetJsonFormat,
		);

		this.logger.info('END: getPromoterReferrals controller');
		return { message: 'Successfully got promoter referrals.', result };
	}

	/**
	 * Get promoter commissions
	 */
	@ApiResponse({ status: 200, description: 'OK' })
	@Permissions('read', Commission)
	@Get(':promoter_id/commissions')
	async getPromoterCommissions(
		@Headers('x-accept-type') acceptType: string,
		@Param('program_id') programId: string,
		@Param('promoter_id') promoterId: string,
		@Query('conversion_type') conversionType: conversionTypeEnum,
		@Query('link_id') linkId: string,
		@Query('contact_id') contactId: string,
		@Query('skip') skip: number = 0,
		@Query('take') take: number = 10,
	) {
		this.logger.info('START: getPromoterCommissions controller');

		const toUseSheetJsonFormat = (acceptType === 'application/json;format=sheet-json');

		const result = await this.promoterService.getPromoterCommissions(
			programId,
			promoterId,
			toUseSheetJsonFormat,
			{
				commissions: {
					conversionType,
					linkId,
					contactId,
				},
			},
			{
				skip,
				take,
			},
		);

		this.logger.info('END: getPromoterCommissions controller');
		return {
			message: 'Successfully fetched all commissions of promoter.',
			result,
		};
	}

	@ApiResponse({ status: 200, description: 'OK' })
	@SkipTransform()
	@Permissions('read', SignUp)
	@Get(':promoter_id/reports/signups')
	async getSignUpsReport(
		@Headers('x-accept-type') acceptType: string,
		@Param('program_id') programId: string,
		@Param('promoter_id') promoterId: string,
		@Res() res: Response,
		@Query('report_period') reportPeriod?: reportPeriodEnum,
		@Query('start_date') startDate?: string,
		@Query('end_date') endDate?: string,
	) {
		this.logger.info('START: getSignUpsReport controller');

		if (acceptType !== 'application/json;format=sheet-json') {
			this.logger.error(`Header accept type must be set to application/json;format=sheet-json`);
			throw new BadRequestException(`Header accept type must be set to application/json;format=sheet-json`);
		}


		const { parsedStartDate, parsedEndDate } = getStartEndDate(startDate, endDate, reportPeriod);

		const workbookBuffer = await this.promoterService.getSignUpsReport(
			programId,
			promoterId,
			parsedStartDate,
			parsedEndDate,
		);

		const fileName = getReportFileName('Signups');

		res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
		res.send(workbookBuffer);
	}

	@ApiResponse({ status: 200, description: 'OK' })
	@SkipTransform()
	@Permissions('read', Purchase)
	@Get(':promoter_id/reports/purchases')
	async getPurchasesReport(
		@Headers('x-accept-type') acceptType: string,
		@Param('program_id') programId: string,
		@Param('promoter_id') promoterId: string,
		@Res() res: Response,
		@Query('report_period') reportPeriod?: reportPeriodEnum,
		@Query('start_date') startDate?: string,
		@Query('end_date') endDate?: string,
	) {
		this.logger.info('START: getPurchasesReport controller');

		if (acceptType !== 'application/json;format=sheet-json') {
			this.logger.error(`Header accept type must be set to application/json;format=sheet-json`);
			throw new BadRequestException(`Header accept type must be set to application/json;format=sheet-json`);
		}


		const { parsedStartDate, parsedEndDate } = getStartEndDate(startDate, endDate, reportPeriod);

		const workbookBuffer = await this.promoterService.getPurchasesReport(
			programId,
			promoterId,
			parsedStartDate,
			parsedEndDate,
		);

		const fileName = getReportFileName('Purchases');

		res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
		res.send(workbookBuffer);
	}

	@ApiResponse({ status: 200, description: 'OK' })
	@SkipTransform()
	@Permissions('read', Commission)
	@Get(':promoter_id/reports/commissions')
	async getCommissionsReport(
		@Headers('x-accept-type') acceptType: string,
		@Param('program_id') programId: string,
		@Param('promoter_id') promoterId: string,
		@Res() res: Response,
		@Query('report_period') reportPeriod?: reportPeriodEnum,
		@Query('start_date') startDate?: string,
		@Query('end_date') endDate?: string,
	) {
		this.logger.info('START: getCommissionsReport controller');

		if (acceptType !== 'application/json;format=sheet-json') {
			this.logger.error(`Header accept type must be set to application/json;format=sheet-json`);
			throw new BadRequestException(`Header accept type must be set to application/json;format=sheet-json`);
		}


		const { parsedStartDate, parsedEndDate } = getStartEndDate(startDate, endDate, reportPeriod);

		const workbookBuffer = await this.promoterService.getCommissionsReport(
			programId,
			promoterId,
			parsedStartDate,
			parsedEndDate,
		);

		const fileName = getReportFileName('Commissions');


		res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

		this.logger.info('END: getCommissionsReport controller');
		res.send(workbookBuffer);
	}

	@ApiResponse({ status: 200, description: 'OK' })
	@SkipTransform()
	@Permissions('read', Commission)
	@Get(':promoter_id/reports/links')
	async getLinksReport(
		@Headers('x-accept-type') acceptType: string,
		@Param('program_id') programId: string,
		@Param('promoter_id') promoterId: string,
		@Res() res: Response,
		@Query('report_period') reportPeriod?: reportPeriodEnum,
		@Query('start_date') startDate?: string,
		@Query('end_date') endDate?: string,
	) {
		this.logger.info('START: getCommissionsReport controller');

		if (acceptType !== 'application/json;format=sheet-json') {
			this.logger.error(`Header accept type must be set to application/json;format=sheet-json`);
			throw new BadRequestException(`Header accept type must be set to application/json;format=sheet-json`);
		}


		const { parsedStartDate, parsedEndDate } = getStartEndDate(startDate, endDate, reportPeriod);

		const workbookBuffer = await this.promoterService.getLinksReport(
			programId,
			promoterId,
			parsedStartDate,
			parsedEndDate,
		);

		const fileName = getReportFileName('Links');


		res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

		this.logger.info('END: getCommissionsReport controller');
		res.send(workbookBuffer);
	}


	@ApiResponse({ status: 200, description: 'OK' })
	@Permissions('read', ReferralView)
	@Get(':promoter_id/reports/referrals')
	async getReferralsReport(
		@Headers('x-accept-type') acceptType: string,
		@Param('program_id') programId: string,
		@Param('promoter_id') promoterId: string,
		@Res() res: Response,
		@Query('report_period') reportPeriod?: reportPeriodEnum,
		@Query('start_date') startDate?: string,
		@Query('end_date') endDate?: string,
	) {
		this.logger.info('START: getReferralsReport controller');

		if (acceptType !== 'application/json;format=sheet-json') {
			this.logger.error(`Header accept type must be set to application/json;format=sheet-json`);
			throw new BadRequestException(`Header accept type must be set to application/json;format=sheet-json`);
		}


		const { parsedStartDate, parsedEndDate } = getStartEndDate(startDate, endDate, reportPeriod);

		const workbookBuffer = await this.promoterService.getReferralsReport(
			programId,
			promoterId,
			parsedStartDate,
			parsedEndDate,
		);

		const fileName = getReportFileName('Referrals');


		res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
		res.send(workbookBuffer);
	}

	/**
	 * Get promoter statistics
	 */
	@ApiResponse({ status: 200, description: 'OK' })
	@ApiResponse({ status: 400, description: 'Bad Request' })
	@Permissions('read', Link)
	@Get(':promoter_id/link_stats')
	async getPromoterLinkStatistics(
		@Headers('x-accept-type') acceptType: string,
		@Param('program_id') programId: string,
		@Param('promoter_id') promoterId: string,
	) {
		this.logger.info('START: getPromoterLinkStatistics controller');

		const toUseSheetJsonFormat = (acceptType === 'application/json;format=sheet-json');

		const result = await this.promoterService.getPromoterLinkStatistics(
			programId,
			promoterId,
			toUseSheetJsonFormat,
		);

		this.logger.info('END: getPromoterLinkStatistics controller');
		return { message: 'Successfully got promoter statistics.', result };
	}
	/**
	 * Get promoter statistics
	 */
	@ApiResponse({ status: 200, description: 'OK' })
	@ApiResponse({ status: 400, description: 'Bad Request' })
	@Permissions('read', PromoterStatsView)
	@Get(':promoter_id/stats')
	async getPromoterStatistics(
		@Headers('x-accept-type') acceptType: string,
		@Param('program_id') programId: string,
		@Param('promoter_id') promoterId: string,
	) {
		this.logger.info('START: getPromoterStatistics controller');

		const toUseSheetJsonFormat = (acceptType === 'application/json;format=sheet-json');

		const result = await this.promoterService.getPromoterStatistics(
			programId,
			promoterId,
			toUseSheetJsonFormat,
		);

		this.logger.info('END: getPromoterStatistics controller');
		return { message: 'Successfully got promoter statistics.', result };
	}

	/**
   * Sign up to program
   */
	@ApiResponse({ status: 201, description: 'OK' })
	@ApiResponse({ status: 409, description: 'Conflict' })
	@ApiResponse({ status: 400, description: 'Bad Request' })
	@SkipPermissions()
	@Get(':promoter_id/referrals')
	async signUpToProgram(@Param('program_id') programId: string, @Param('promoter_id') promoterId: string) {
	  this.logger.info('START: signUpToProgram controller');
  
	  const result = await this.promoterService.signUpPromoterToProgram(programId, promoterId);
  
	  this.logger.info('END: signUpToProgram controller');
	  return { message: 'Successfully got program referrals.', result };
	}
}
