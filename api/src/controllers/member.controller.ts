import {
  Controller, Get, Post, Patch, Body, Param, Delete, UseGuards
} from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { MemberService } from '../services/member.service'
// import { AuthGuard } from '../guards/auth/auth.guard';
import { CreateMemberDto, MemberDto, UpdateMemberDto } from '../dtos';
import { LoggerService } from '../services/logger.service';
import { MemberAuthService } from '../services/memberAuth.service';
import { UnifiedAuthGuard } from 'src/guards/auth/auth.guard';
import { MemberPermissionsGuard } from 'src/guards/permissions/memberPermissions.guard';
import { MemberPermissions } from 'src/decorators/permissions.decorator';
import { Member } from 'src/entities';

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
  @Post('signup')
  async memberSignUp(@Param('program_id') programId: string, @Body() body: CreateMemberDto) {
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
  @Post('login')
  async login(@Body() body: any) {
    this.logger.info('START: login controller');

    const transformedBody = plainToInstance(MemberDto, body);

    const result = await this.memberAuthService.authenticateMember({
      email: transformedBody.email,
      password: transformedBody.password,
    });

    this.logger.info('END: login controller');
    return { message: 'Successfully logged in user.', result };
  }

  /**
   * Get member
  */
  @ApiResponse({ status: 200, description: 'OK' })
  @UseGuards(UnifiedAuthGuard, MemberPermissionsGuard)
  @MemberPermissions('read', Member)
  @Get(':member_id')
  async getMember(@Param('program_id') programId: string, @Param('member_id') memberId: string) {
    this.logger.info('START: getMember controller');

    const result = await this.memberService.getMember(memberId);

    this.logger.info('END: getMember controller');
    return { message: 'Successfully fetched member.', result };
  }

  /**
   * Update member info
   */
  @ApiResponse({ status: 204, description: 'No Content' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @UseGuards(UnifiedAuthGuard, MemberPermissionsGuard)
  @MemberPermissions('update', Member)
  @Patch(':member_id')
  async updateMemberInfo(@Param('program_id') programId: string, @Param('member_id') memberId: string, @Body() body: UpdateMemberDto) {
    this.logger.info('START: updateMemberInfo controller');

    await this.memberService.updateMemberInfo(memberId, body);

    this.logger.info('END: updateMemberInfo controller');
    return { message: 'Successfully updated member information.' };
  }

  @ApiResponse({ status: 204, description: 'No Content' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @UseGuards(UnifiedAuthGuard, MemberPermissionsGuard)
  // @MemberPermissions('delete', 'Member')
  @MemberPermissions('delete', Member)
  @Delete(':member_id')
  async deleteUser(@Param('program_id') programId: string, @Param('member_id') memberId: string) {
    this.logger.info('START: deleteUser controller');

    await this.memberService.deleteMember(memberId);

    this.logger.info('END: deleteUser controller');
    return { message: 'Successfully deleted member.' };
  }
}
