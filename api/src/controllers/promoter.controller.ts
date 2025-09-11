import { Controller, Get, Post, Delete, Patch, Body, Param, Query, Res, Headers, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { PromoterService } from '../services/promoter.service';
import {
	CreateMemberDto,
	CreatePromoterDto,
	RegisterForProgramDto,
	UpdatePromoterDto,
	UpdatePromoterMemberDto,
} from '../dtos';
import { SkipTransform } from '../decorators/skipTransform.decorator';
import { statusEnum, conversionTypeEnum, memberSortByEnum, memberRoleEnum, commissionSortByEnum, linkSortByEnum } from '../enums';
import { LoggerService } from '../services/logger.service';
import { Permissions } from '../decorators/permissions.decorator';
import {
	Commission,
	Promoter,
	PromoterMember,
	Purchase,
	ReferralView,
	PromoterAnalyticsView,
	SignUp,
	LinkAnalyticsView,
} from '../entities';
import { sortOrderEnum } from 'src/enums/sortOrder.enum';
import { referralSortByEnum } from 'src/enums/referralSortBy.enum';
import { getReportFileName, getStartEndDate } from 'src/utils';
import { PassThrough } from 'node:stream';
import archiver from 'archiver';

@ApiTags('Promoter')
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
	@Permissions('create', Promoter)
	@Post()
	async createPromoter(
		@Headers('member_id') memberId: string,
		@Param('program_id') programId: string,
		@Body() body: CreatePromoterDto,
	) {
		this.logger.info('START: createPromoter controller');

		const result = await this.promoterService.createPromoter(
			programId,
			body,
			memberId,
		);

		this.logger.info('END: createPromoter controller');
		return { message: 'Successfully created promoter.', result };
	}

	/**
	 * Create promoter
	 */
	@ApiResponse({ status: 204, description: 'No Content' })
	@ApiResponse({ status: 400, description: 'Bad Request' })
	@ApiResponse({ status: 403, description: 'Unauthorized' })
	@Permissions('delete', Promoter)
	@Delete(':promoter_id')
	async deletePromoter(
		@Headers('member_id') memberId: string,
		@Param('program_id') programId: string,
		@Param('promoter_id') promoterId: string,
	) {
		this.logger.info('START: deletePromoter controller');

		const result = await this.promoterService.deletePromoter(
			memberId,
			programId,
			promoterId,
		);

		this.logger.info('END: deletePromoter controller');
		return { message: 'Successfully deleted promoter.', result };
	}

	/**
	 * Create promoter
	 */
	@ApiResponse({ status: 200, description: 'OK' })
	@Permissions('update', Promoter)
	@Patch(':promoter_id')
	async updatePromoterInfo(
		@Param('program_id') programId: string,
		@Param('promoter_id') promoterId: string,
		@Body() body: UpdatePromoterDto,
	) {
		this.logger.info('START: updatePromoterInfo controller');

		const result = await this.promoterService.updatePromoterInfo(programId, promoterId, body);

		this.logger.info('END: updatePromoterInfo controller');
		return { message: 'Successfully updated promoter.', result };
	}

	/**
	 * Get promoter
	 */
	@ApiResponse({ status: 200, description: 'OK' })
	@Permissions('read', Promoter)
	@Get(':promoter_id')
	async getPromoter(@Param('program_id') programId: string, @Param('promoter_id') promoterId: string) {
		this.logger.info('START: getPromoter controller');

		const result = await this.promoterService.getPromoter(programId, promoterId);

		this.logger.info(`END: getPromoter controller`);
		return { message: 'Successfully fetched promoter.', result };
	}

	/**
	 * Invite member
	 */
	@ApiResponse({ status: 201, description: 'Created' })
	@Permissions('invite_member', Promoter)
	@Post(':promoter_id/members')
	async addMember(
		@Param('program_id') programId: string,
		@Param('promoter_id') promoterId: string,
		@Body() body: CreateMemberDto,
	) {
		this.logger.info('START: addMember controller');

		const result = await this.promoterService.addMember(
			programId,
			promoterId,
			body,
		);

		this.logger.info('END: addMember controller');
		return { message: 'Successfully added member to promoter.', result };
	}

	/**
	 * Get all members
	 */
	@ApiResponse({ status: 200, description: 'OK' })
	@Permissions('read_all', PromoterMember)
	@Get(':promoter_id/members')
	async getAllMembers(
		@Headers('x-accept-type') acceptType: string,
		@Param('program_id') programId: string,
		@Param('promoter_id') promoterId: string,
		@Query('role') role: memberRoleEnum,
		@Query('email') email: string,
		@Query('sort_by') sortBy: memberSortByEnum = memberSortByEnum.NAME,
		@Query('sort_order') sortOrder: sortOrderEnum = sortOrderEnum.DESCENDING,
		@Query('status') status: statusEnum,
		@Query('skip') skip: number = 0,
		@Query('take') take: number = 10,
	) {
		this.logger.info('START: getAllMembers controller');

		const toUseSheetJsonFormat = (acceptType === 'application/json;format=sheet-json');

		const result = await this.promoterService.getAllMembers(
			promoterId,
			sortBy,
			sortOrder,
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
	@Patch(':promoter_id/members/:member_id/role')
	async updateRole(
		@Headers('member_id') memberId: string,
		@Param('member_id') targetMemberId: string,
		@Body() body: UpdatePromoterMemberDto,
	) {
		this.logger.info('START: updateRole controller');

		await this.promoterService.updateRole(memberId, targetMemberId, body);

		this.logger.info('END: updateRole controller');
		return { message: 'Successfully updated role of member.' };
	}

	/**
	 * Remove member
	 */
	@ApiResponse({ status: 204, description: 'No Content' })
	@ApiResponse({ status: 403, description: 'Forbidden' })
	@Permissions('remove_member', PromoterMember)
	@Patch(':promoter_id/members/:member_id')
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
	) {
		this.logger.info('START: getSignUpsForPromoter controller');

		const toUseSheetJsonFormat = (acceptType === 'application/json;format=sheet-json');

		const result = await this.promoterService.getSignUpsForPromoter(
			programId,
			promoterId,
			toUseSheetJsonFormat,
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
	) {
		this.logger.info('START: getPurchasesForPromoter controller');

		const toUseSheetJsonFormat = (acceptType === 'application/json;format=sheet-json');

		const result = await this.promoterService.getPurchasesForPromoter(
			programId,
			promoterId,
			toUseSheetJsonFormat,
			{
				...(itemId && { itemId }),
			}
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
	@Permissions('read_all', ReferralView)
	@Get(':promoter_id/referrals')
	async getPromoterReferrals(
		@Headers('member_id') memberId: string,
		@Headers('x-accept-type') acceptType: string,
		@Param('program_id') programId: string,
		@Param('promoter_id') promoterId: string,
		@Query('sort_by') sortBy: referralSortByEnum = referralSortByEnum.UPDATED_AT,
		@Query('sort_order') sortOrder: sortOrderEnum = sortOrderEnum.DESCENDING, // latest first
		@Query('skip') skip: number = 0,
		@Query('take') take: number = 10,
	) {
		this.logger.info('START: getPromoterReferrals controller');

		const toUseSheetJsonFormat = (acceptType === 'application/json;format=sheet-json');
		const result = await this.promoterService.getPromoterReferrals(
			memberId,
			programId,
			promoterId,
			sortBy,
			sortOrder,
			toUseSheetJsonFormat,
			undefined,
			{
				skip,
				take
			}
		);

		this.logger.info('END: getPromoterReferrals controller');
		return { message: 'Successfully got promoter referrals.', result };
	}

	/**
	 * Get promoter referral, for a program
	 */
	@ApiResponse({ status: 201, description: 'OK' })
	@ApiResponse({ status: 400, description: 'Bad Request' })
	@Permissions('read', ReferralView)
	@Get(':promoter_id/referrals/:contact_id')
	async getPromoterReferral(
		@Headers('x-accept-type') acceptType: string,
		@Param('program_id') programId: string,
		@Param('promoter_id') promoterId: string,
		@Param('contact_id') contactId: string,
	) {
		this.logger.info('START: getPromoterReferral controller');

		const result = await this.promoterService.getPromoterReferral(
			programId,
			promoterId,
			contactId
		);

		this.logger.info('END: getPromoterReferral controller');
		return { message: `Successfully got promoter referral ${contactId}.`, result };
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
		@Query('sort_by') sortBy: commissionSortByEnum = commissionSortByEnum.UPDATED_AT,
		@Query('sort_order') sortOrder: sortOrderEnum = sortOrderEnum.DESCENDING, // latest first
		@Query('skip') skip: number = 0,
		@Query('take') take: number = 10,
	) {
		this.logger.info('START: getPromoterCommissions controller');

		const toUseSheetJsonFormat = (acceptType === 'application/json;format=sheet-json');

		const result = await this.promoterService.getPromoterCommissions(
			programId,
			promoterId,
			sortBy,
			sortOrder,
			toUseSheetJsonFormat,
			{
				conversionType,
				linkId,
				contactId,
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
	@Get(':promoter_id/reports/signups')
	async getSignUpsReport(
		@Headers('x-accept-type') acceptType: string,
		@Param('program_id') programId: string,
		@Param('promoter_id') promoterId: string,
		@Headers('member_id') memberId: string,
		@Res() res: Response,
		@Query('start_date') startDate?: string,
		@Query('end_date') endDate?: string,
	) {
		this.logger.info('START: getSignUpsReport controller');

		if (acceptType !== 'application/json;format=sheet-json') {
			this.logger.error(`Header accept type must be set to application/json;format=sheet-json`);
			throw new BadRequestException(`Header accept type must be set to application/json;format=sheet-json`);
		}


		const { parsedStartDate, parsedEndDate } = getStartEndDate(startDate, endDate);

		const signUpCSV = await this.promoterService.getSignUpsReport(
			programId,
			promoterId,
			memberId,
			parsedStartDate,
			parsedEndDate,
		);

		const fileName = getReportFileName('Signups');

		res.setHeader('Content-Type', 'text/csv; charset=utf-8');
		res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
		res.setHeader('X-Content-Type-Options', 'nosniff');
		res.setHeader('Cache-Control', 'no-store');

		signUpCSV.pipe(res);
	}

	@ApiResponse({ status: 200, description: 'OK' })
	@SkipTransform()
	@Get(':promoter_id/reports/purchases')
	async getPurchasesReport(
		@Headers('x-accept-type') acceptType: string,
		@Headers('member_id') memberId: string,
		@Param('program_id') programId: string,
		@Param('promoter_id') promoterId: string,
		@Res() res: Response,
		@Query('start_date') startDate?: string,
		@Query('end_date') endDate?: string,
	) {
		this.logger.info('START: getPurchasesReport controller');

		if (acceptType !== 'application/json;format=sheet-json') {
			this.logger.error(`Header accept type must be set to application/json;format=sheet-json`);
			throw new BadRequestException(`Header accept type must be set to application/json;format=sheet-json`);
		}


		const { parsedStartDate, parsedEndDate } = getStartEndDate(startDate, endDate);

		const purchaseCSV = await this.promoterService.getPurchasesReport(
			programId,
			promoterId,
			memberId,
			parsedStartDate,
			parsedEndDate,
		);

		const fileName = getReportFileName('Purchases');

		res.setHeader('Content-Type', 'text/csv; charset=utf-8');
		res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
		res.setHeader('X-Content-Type-Options', 'nosniff');
		res.setHeader('Cache-Control', 'no-store');

		purchaseCSV.pipe(res);
	}

	@ApiResponse({ status: 200, description: 'OK' })
	@SkipTransform()
	@Get(':promoter_id/reports/commissions')
	async getCommissionsReport(
		@Headers('x-accept-type') acceptType: string,
		@Param('program_id') programId: string,
		@Param('promoter_id') promoterId: string,
		@Headers('member_id') memberId: string,
		@Res() res: Response,
		@Query('start_date') startDate?: string,
		@Query('end_date') endDate?: string,
	) {
		this.logger.info('START: getCommissionsReport controller');

		if (acceptType !== 'application/json;format=sheet-json') {
			this.logger.error(`Header accept type must be set to application/json;format=sheet-json`);
			throw new BadRequestException(`Header accept type must be set to application/json;format=sheet-json`);
		}


		const { parsedStartDate, parsedEndDate } = getStartEndDate(startDate, endDate);

		const { purchaseStream, signupStream } = await this.promoterService.getCommissionsReport(
			programId,
			promoterId,
			memberId,
			parsedStartDate,
			parsedEndDate,
		);

		const fileName = "Commissions.zip"

		res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

		const archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level.
        });

		archive.on('error', (err) => {
            this.logger.error('Archiver error:', err);
            throw err;
        });

		archive.pipe(res);

		archive.append(signupStream, { name: getReportFileName('Signups') });
        archive.append(purchaseStream, { name: getReportFileName('Purchases') });


		this.logger.info('END: getCommissionsReport controller');
		await archive.finalize();

		this.logger.info(`Successfully streamed and finalized zip archive "${fileName}".`);
	}

	@ApiResponse({ status: 200, description: 'OK' })
	@SkipTransform()
	@Get(':promoter_id/reports/links')
	async getLinksReport(
		@Headers('x-accept-type') acceptType: string,
		@Headers('member_id') memberId: string,
		@Param('program_id') programId: string,
		@Param('promoter_id') promoterId: string,
		@Res() res: Response,
		@Query('start_date') startDate?: string,
		@Query('end_date') endDate?: string,
	) {
		this.logger.info('START: getCommissionsReport controller');

		if (acceptType !== 'application/json;format=sheet-json') {
			this.logger.error(`Header accept type must be set to application/json;format=sheet-json`);
			throw new BadRequestException(`Header accept type must be set to application/json;format=sheet-json`);
		}


		const { parsedStartDate, parsedEndDate } = getStartEndDate(startDate, endDate);

		const workbookBuffer = await this.promoterService.getLinksReport(
			programId,
			promoterId,
			memberId,
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
	@Get(':promoter_id/reports/referrals')
	async getReferralsReport(
		@Headers('member_id') memberId: string,
		@Headers('x-accept-type') acceptType: string,
		@Param('program_id') programId: string,
		@Param('promoter_id') promoterId: string,
		@Res() res: Response,
		@Query('start_date') startDate?: string,
		@Query('end_date') endDate?: string,
	) {
		this.logger.info('START: getReferralsReport controller');

		if (acceptType !== 'application/json;format=sheet-json') {
			this.logger.error(`Header accept type must be set to application/json;format=sheet-json`);
			throw new BadRequestException(`Header accept type must be set to application/json;format=sheet-json`);
		}


		const { parsedStartDate, parsedEndDate } = getStartEndDate(startDate, endDate);

		const workbookBuffer = await this.promoterService.getReferralsReport(
			memberId,
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
	 * Get promoter link analytics
	 */
	@ApiResponse({ status: 200, description: 'OK' })
	@ApiResponse({ status: 400, description: 'Bad Request' })
	@Permissions('read_all', LinkAnalyticsView)
	@Get(':promoter_id/link_analytics')
	async getPromoterLinkAnalytics(
		@Headers('x-accept-type') acceptType: string,
		@Param('program_id') programId: string,
		@Param('promoter_id') promoterId: string,
		@Query('sort_by') sortBy: linkSortByEnum.CREATED_AT,
		@Query('sort_order') sortOrder: sortOrderEnum = sortOrderEnum.DESCENDING, // latest first
		@Query('skip') skip: number = 0,
		@Query('take') take: number = 10,
	) {
		this.logger.info('START: getPromoterLinkAnalytics controller');

		const toUseSheetJsonFormat = (acceptType === 'application/json;format=sheet-json');

		const result = await this.promoterService.getPromoterLinkAnalytics(
			programId,
			promoterId,
			sortBy,
			sortOrder,
			toUseSheetJsonFormat,
			{
				skip,
				take
			}
		);

		this.logger.info('END: getPromoterLinkStatistics controller');
		return { message: 'Successfully got promoter link analytics.', result };
	}
	/**
	 * Get promoter statistics
	 */
	@ApiResponse({ status: 200, description: 'OK' })
	@ApiResponse({ status: 400, description: 'Bad Request' })
	@Permissions('read', PromoterAnalyticsView)
	@Get(':promoter_id/analytics')
	async getPromoterAnalytics(
		@Headers('x-accept-type') acceptType: string,
		@Param('program_id') programId: string,
		@Param('promoter_id') promoterId: string,
	) {
		this.logger.info('START: getPromoterAnalytics controller');

		const toUseSheetJsonFormat = (acceptType === 'application/json;format=sheet-json');

		const result = await this.promoterService.getPromoterAnalytics(
			programId,
			promoterId,
			toUseSheetJsonFormat,
		);

		this.logger.info('END: getPromoterAnalytics controller');
		return { message: 'Successfully got promoter analytics.', result };
	}

	/**
   * Sign up to program
   */
	@ApiResponse({ status: 201, description: 'OK' })
	@ApiResponse({ status: 409, description: 'Conflict' })
	@ApiResponse({ status: 400, description: 'Bad Request' })
	@Permissions('register', Promoter)
	@Post(':promoter_id/register')
	async registerForProgram(
		@Param('program_id') programId: string, 
		@Param('promoter_id') promoterId: string,
		@Query('circle_id') circleId: string | undefined,
		@Body() body: RegisterForProgramDto,
	) {
		this.logger.info('START: registerForProgram controller');

		const result = await this.promoterService.registerForProgram(body.acceptedTermsAndConditions, programId, promoterId, circleId);

		const message = body.acceptedTermsAndConditions 
			? `Successfully registered for Program ${programId} => 'terms and conditions accepted'` 
			: `Warning. Terms and conditions rejected. You will be unable to create links, get reports or track referrals until TNC are accepted.`;

		this.logger.info('END: registerForProgram controller');
		return { message, result };
	}
}
