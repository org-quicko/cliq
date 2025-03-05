import {
  Controller, Get, Post, Delete, Patch, Body, Param, Query,
  Res,
  UseGuards,
  Req
} from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import * as fs from 'fs';
import { Response } from 'express';
import { PromoterService } from '../services/promoter.service'
import { CreatePromoterDto, InviteMemberDto, UpdatePromoterMemberDto } from '../dtos';
import { SkipTransform } from '../decorators/skipTransform.decorator';
import { roleEnum, statusEnum, conversionTypeEnum } from '../enums';
import { LoggerService } from '../services/logger.service';
import { RequestWithUser } from '../interfaces/requestWithUser.interface';
import { UnifiedAuthGuard } from '../guards/auth/auth.guard';
import { MemberPermissionsGuard } from '../guards/permissions/memberPermissions.guard';
import { MemberPermissions } from '../decorators/permissions.decorator';
import { Commission, Contact, Member, Promoter, PromoterMember, Purchase, ReferralView, SignUp } from '../entities';

@ApiTags('Promoter')
@UseGuards(UnifiedAuthGuard, MemberPermissionsGuard)
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
  async createPromoter(@Req() req: RequestWithUser, @Param('program_id') programId: string, @Body() body: CreatePromoterDto) {
    this.logger.info('START: createPromoter controller')

    const memberId = req.user.user_id;
    const result = await this.promoterService.createPromoter(memberId, programId, body);

    this.logger.info('END: createPromoter controller')
    return { message: 'Successfully created promoter.', result };
  }

  /**
   * Get promoter
   */
  @ApiResponse({ status: 200, description: 'OK' })
  @MemberPermissions('read', Promoter)
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
  @MemberPermissions('invite_member', Promoter)
  @Post(':promoter_id/members')
  async inviteMember(@Param('program_id') programId: string, @Param('promoter_id') promoterId: string, @Body() body: InviteMemberDto) {
    this.logger.info('START: inviteMember controller')

    const result = await this.promoterService.inviteMember(programId, promoterId, body);

    this.logger.info('END: inviteMember controller');
    return { message: 'Successfully invited member to promoter.', result };
  }

  /**
   * Get all members
   */
  @ApiResponse({ status: 200, description: 'OK' })
  @MemberPermissions('read', Member)
  @Get(':promoter_id/members')
  async getAllMembers(
    @Param('program_id') programId: string,
    @Param('promoter_id') promoterId: string,
    @Query('role') role: roleEnum,
    @Query('email') email: string,
    @Query('status') status: statusEnum,
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,

  ) {
    this.logger.info('START: getAllMembers controller');

    const result = await this.promoterService.getAllMembers(promoterId, {
      email,
      role,
      status,
      skip,
      take
    });

    this.logger.info('END: getAllMembers controller');
    return { message: 'Successfully fetched members of promoter.', result };
  }

  /**
   * Update role
   */
  @ApiResponse({ status: 204, description: 'No Content' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @MemberPermissions('change_role', PromoterMember)
  @Patch(':promoter_id/members/:member_id')
  async updateRole(@Param('member_id') memberId: string, @Body() body: UpdatePromoterMemberDto) {
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
  @MemberPermissions('remove_member', PromoterMember)
  @Delete(':promoter_id/members/:member_id')
  async removeMember(@Param('promoter_id') promoterId: string, @Param('member_id') memberId: string) {
    this.logger.info('START: removeMember controller');

    await this.promoterService.removeMember(promoterId, memberId);

    this.logger.info('END: removeMember controller');
    return { message: 'Successfully removed member from promoter.' };
  }

  /**
   * Get contacts for promoter
   */
  @ApiResponse({ status: 200, description: 'OK' })
  @MemberPermissions('read', Contact)
  @Get(':promoter_id/contacts')
  async getContactsForPromoter(
    @Param('program_id') programId: string,
    @Param('promoter_id') promoterId: string,
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
  ) {
    this.logger.info('START: getContactsForPromoter controller');

    const result = await this.promoterService.getContactsForPromoter(programId, promoterId, {
      skip,
      take
    });

    this.logger.info('END: getContactsForPromoter controller');
    return { message: 'Successfully fetched all contacts of promoter.', result };
  }

  /**
   * Get signups for promoter
   */
  @ApiResponse({ status: 200, description: 'OK' })
  @MemberPermissions('read', SignUp)
  @Get(':promoter_id/signups')
  async getSignUpsForPromoter(
    @Param('program_id') programId: string,
    @Param('promoter_id') promoterId: string,
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
  ) {
    this.logger.info('START: getSignUpsForPromoter controller');

    const result = await this.promoterService.getSignUpsForPromoter(programId, promoterId, {
      skip,
      take
    });

    this.logger.info('END: getSignUpsForPromoter controller');
    return { message: 'Successfully fetched all signups of promoter.', result };
  }

  /**
   * Get purchases for promoter
   */
  @ApiResponse({ status: 200, description: 'OK' })
  @MemberPermissions('read', Purchase)
  @Get(':promoter_id/purchases')
  async getPurchasesForPromoter(
    @Param('program_id') programId: string,
    @Param('promoter_id') promoterId: string,
    @Query('external_id') externalId?: string,
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
  ) {
    this.logger.info('START: getPurchasesForPromoter controller');

    const result = await this.promoterService.getPurchasesForPromoter(programId, promoterId, {
      externalId,
      skip,
      take,
    });

    this.logger.info('END: getPurchasesForPromoter controller');
    return { message: 'Successfully fetched all purchases of promoter.', result };
  }

  /**
   * Get promoter commissions
   */
  @ApiResponse({ status: 200, description: 'OK' })
  @MemberPermissions('read', Commission)
  @Get(':promoter_id/commissions')
  async getPromoterCommissions(
    @Param('program_id') programId: string,
    @Param('promoter_id') promoterId: string,
    @Query('conversion_type') conversionType: conversionTypeEnum,
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
  ) {
    this.logger.info('START: getPromoterCommissions controller');

    const result = await this.promoterService.getPromoterCommissions(programId, promoterId, {
      conversionType,
      skip,
      take,
    });

    this.logger.info('END: getPromoterCommissions controller');
    return { message: 'Successfully fetched all commissions of promoter.', result };
  }

  @ApiResponse({ status: 200, description: 'OK' })
  @SkipTransform()
  @MemberPermissions('read', Contact)
  @Get(':promoter_id/reports/contacts')
  async getContactsReport(@Param('program_id') programId: string, @Param('promoter_id') promoterId: string, @Res() res: Response) {
    this.logger.info('START: getContactsReport controller');

    const filePath = await this.promoterService.getContactsReport(programId, promoterId);

    res.header('Content-Type', 'text/csv');
    res.attachment(`promoter_${promoterId}_contacts.csv`);

    res.on('finish', async () => {
      try {
        await fs.promises.unlink(filePath);
        console.log(`File deleted successfully`);
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    });

    this.logger.info('END: getContactsReport controller');
    res.sendFile(filePath);
  }

  @ApiResponse({ status: 200, description: 'OK' })
  @SkipTransform()
  @MemberPermissions('read', Purchase)
  @Get(':promoter_id/reports/purchases')
  async getPurchasesReport(@Param('program_id') programId: string, @Param('promoter_id') promoterId: string, @Res() res: Response) {
    this.logger.info('START: getPurchasesReport controller');

    const filePath = await this.promoterService.getPurchasesReport(programId, promoterId);

    res.header('Content-Type', 'text/csv');
    res.attachment(`promoter_${promoterId}_purchases.csv`);

    res.on('finish', async () => {
      try {
        await fs.promises.unlink(filePath);
        console.log(`File deleted successfully`);
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    });

    this.logger.info('END: getPurchasesReport controller');
    res.sendFile(filePath);
  }

  /**
     * Get promoter referrals, for a program
     */
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @MemberPermissions('read', ReferralView)
  @Get(':promoter_id/referrals')
  async getPromoterReferrals(@Param('program_id') programId: string, @Param('promoter_id') promoterId: string) {
    this.logger.info('START: getPromoterReferrals controller');

    const result = await this.promoterService.getPromoterReferrals(programId, promoterId);

    this.logger.info('END: getPromoterReferrals controller');
    return { message: 'Successfully got promoter referrals.', result };
  }

  /**
   * Get promoter statistics
   */
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Get(':promoter_id/stats')
  async getPromoterStatistics(@Param('program_id') programId: string, @Param('promoter_id') promoterId: string) {
    this.logger.info('START: getPromoterStatistics controller');

    const result = await this.promoterService.getPromoterStatistics(programId, promoterId);

    this.logger.info('END: getPromoterStatistics controller');
    return { message: 'Successfully got promoter statistics.', result };
  }
}
