import { Controller, Get, Post, Delete, Patch, Body, Param, Query, Headers, Res, BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { ProgramService } from '../services/program.service';
import { LoggerService } from '../services/logger.service';
import {
  CreateProgramDto,
  UpdateProgramDto,
  UpdateProgramUserDto,
  CreateUserDto,
} from '../dtos';
import {
  visibilityEnum,
  statusEnum,
  userRoleEnum,
  conversionTypeEnum,
} from '../enums';
import { Permissions } from '../decorators/permissions.decorator';
import {
  Commission,
  Program,
  ProgramPromoter,
  ProgramUser,
  Purchase,
  ReferralView,
  SignUp,
} from '../entities';
import { getReportFileName, getStartEndDate } from '../utils';
import { Response } from 'express';
import { SkipTransform } from '../decorators/skipTransform.decorator';
import { isUUID } from 'class-validator';
import { Public } from 'src/decorators/public.decorator';

@ApiTags('Program')
@Controller('/programs')
export class ProgramController {
  constructor(
    private readonly programService: ProgramService,
    private logger: LoggerService,
  ) { }

  /**
   * Create program
   */
  @ApiResponse({ status: 201, description: 'Created' })
  @Permissions('create', Program)
  @Post()
  async createProgram(
    @Headers('user_id') userId: string,
    @Body() body: CreateProgramDto,
  ) {
    this.logger.info('START: createProgram controller');

    const result = await this.programService.createProgram(userId, body);

    this.logger.info('END: createProgram controller');
    return { message: 'Successfully created program.', result };
  }

  /**
   * Get all programs that the user is part of.
   */
  @ApiResponse({ status: 200, description: 'OK' })
  @Permissions('read_all', Program)
  @Get()
  async getAllPrograms(
    @Headers('user_id') userId: string,
    @Query('name') name: string,
    @Query('visibility') visibility: visibilityEnum,
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
  ) {
    this.logger.info('START: getAllPrograms controller');

    const result = await this.programService.getAllPrograms(
      userId,
      {
        name,
        visibility
      },
      {
        skip,
        take,
      });

    this.logger.info('END: getAllPrograms controller');
    return { message: `Successfully fetched all programs of user ${userId}.`, result };
  }

  /**
   * Get program
   */
  @ApiResponse({ status: undefined, description: '' })
	@Public()
  @Get(':program_id')
  async getProgram(@Param('program_id') programId: string) {
    this.logger.info('START: getProgram controller');

    if (!isUUID(programId)) {
      throw new NotFoundException('Program not found');
    }

    const result = await this.programService.getProgram(programId);

    this.logger.info('END: getProgram controller');
    return { message: 'Successfully fetched program.', result };
  }

  /**
   * Update program
   */
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Permissions('update', Program)
  @Patch(':program_id')
  async updateProgram(
    @Param('program_id') programId: string,
    @Body() body: UpdateProgramDto,
  ) {
    this.logger.info('START: updateProgram controller');

    await this.programService.updateProgram(programId, body);

    this.logger.info('END: updateProgram controller');
    return { message: 'Successfully updated program.' };
  }

  /**
   * Delete program
   */
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Permissions('delete', Program)
  @Delete(':program_id')
  async deleteProgram(@Param('program_id') programId: string) {
    this.logger.info('START: deleteProgram controller');

    await this.programService.deleteProgram(programId);

    this.logger.info('END: deleteProgram controller');
    return { message: 'Successfully deleted program.' };
  }

  /**
   * Add user
   */
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Permissions('invite_user', Program)
  @Post(':program_id/invite')
  async addUser(
    @Param('program_id') programId: string,
    @Body() body: CreateUserDto,
  ) {
    this.logger.info('START: addUser controller');

    await this.programService.addUser(programId, body);

    this.logger.info('END: addUser controller');
    return { message: 'Successfully added user to program.' };
  }

  /**
   * Get all users
   */
  @ApiResponse({ status: 200, description: 'OK' })
  // @SkipTransform()
  @Permissions('read', ProgramUser)
  @Get(':program_id/users')
  async getAllUsers(
    @Headers('x-accept-type') acceptType: string,
    @Param('program_id') programId: string,
    @Query('status') status?: statusEnum,
    @Query('role') role?: userRoleEnum,
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
  ) {
    this.logger.info('START: getAllUsers controller');

    const toUseSheetJsonFormat = (acceptType === 'application/json;format=sheet-json');

    const result = await this.programService.getAllUsers(
      programId,
      toUseSheetJsonFormat,
      {
        status,
        role,
      },
      {
        skip,
        take,
      }
    );
    this.logger.info('END: getAllUsers controller');
    return {
      message: 'Successfully fetched all users of program.',
      result,
    };
  }

  /**
   * Update
   */
  @ApiResponse({ status: 204, description: 'No Content' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Permissions('change_role', ProgramUser)
  @Patch(':program_id/users/:user_id')
  async updateRole(
    @Param('program_id') programId: string,
    @Param('user_id') userId: string,
    @Body() body: UpdateProgramUserDto,
  ) {
    this.logger.info('START: updateRole controller');

    await this.programService.updateRole(programId, userId, body);

    this.logger.info('END: updateRole controller');
    return { message: 'Successfully updated role of user.' };
  }

  /**
   * Remove user
   */
  @ApiResponse({ status: 204, description: 'No Content' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Permissions('remove_user', ProgramUser)
  @Delete(':program_id/users/:user_id')
  async removeUser(
    @Param('program_id') programId: string,
    @Param('user_id') userId: string,
  ) {
    this.logger.info('START: removeUser controller');
    await this.programService.removeUser(programId, userId);
    this.logger.info('END: removeUser controller');
    return { message: 'Successfully removed user from program.' };
  }

  /**
   * Get all promoters
   */
  @ApiResponse({ status: 200, description: 'OK' })
  @Permissions('read_all', ProgramPromoter)
  @Get(':program_id/promoters')
  async getAllPromoters(
    @Param('program_id') programId: string,
    @Query('name') name?: string,
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
  ) {
    this.logger.info('START: getAllPromoters controller');
    const result = await this.programService.getAllPromoters(
      programId,
      {
        name,
      },
      {
        skip,
        take,
      }
    );
    this.logger.info('END: getAllPromoters controller');
    return {
      message: 'Successfully fetched all promoters of program.',
      result,
    };
  }

  /**
   * Get signups in program
   */
  @ApiResponse({ status: 200, description: 'OK' })
  @Permissions('read', SignUp)
  @Get(':program_id/signups')
  async getSignUpsInProgram(
    @Headers('user_id') userId: string,
    @Param('program_id') programId: string,
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
  ) {
    this.logger.info('START: getSignUpsInProgram controller');

    const result = await this.programService.getSignUpsInProgram(
      userId,
      programId,
      {
        skip,
        take,
      },
    );

    this.logger.info('END: getSignUpsInProgram controller');
    return {
      message: 'Successfully fetched all signups of program.',
      result,
    };
  }

  /**
   * Get purchases in program
   */
  @ApiResponse({ status: 200, description: 'OK' })
  @Permissions('read', Purchase)
  @Get(':program_id/purchases')
  async getPurchasesInProgram(
    @Headers('user_id') userId: string,
    @Param('program_id') programId: string,
    @Query('item_id') itemId?: string,
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
  ) {
    this.logger.info('START: getPurchasesInProgram');

    const result = await this.programService.getPurchasesInProgram(
      userId,
      programId,
      {
        itemId
      },
      {
        skip,
        take,
      },
    );

    this.logger.info('END: getPurchasesInProgram');
    return {
      message: 'Successfully fetched all purchases of program.',
      result,
    };
  }

  /**
   * Get all commissions
   */
  @ApiResponse({ status: undefined, description: '' })
  @Permissions('read', Commission)
  @Get(':program_id/commissions')
  async getAllCommissions(
    @Headers('user_id') userId: string,
    @Param('program_id') programId: string,
    @Query('conversion_type') conversionType: conversionTypeEnum,
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
  ) {
    this.logger.info('START: getAllCommissions controller');

    const result = await this.programService.getAllCommissions(
      userId,
      programId,
      {
        conversionType,
      },
      {
        skip,
        take,
      },
    );

    this.logger.info('END: getAllCommissions controller');
    return {
      message: 'Successfully fetched all commissions of program.',
      result,
    };
  }

  /**
   * Get program report
   */
  @ApiResponse({ status: undefined, description: '' })
  @SkipTransform()
  @Permissions('read', Program)
  @Get(':program_id/report')
  async getProgramReport(
    @Headers('x-accept-type') acceptType: string,
    @Param('program_id') programId: string,
    @Res() res: Response,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    this.logger.info('START: getProgramReport controller');

    if (acceptType !== 'application/json;format=sheet-json') {
      this.logger.error(`Header accept type must be set to application/json;format=sheet-json`);
      throw new BadRequestException(`Header accept type must be set to application/json;format=sheet-json`);
    }

    const { parsedStartDate, parsedEndDate } = getStartEndDate(startDate, endDate);

    const workbookBuffer = await this.programService.getProgramReport(programId, parsedStartDate, parsedEndDate);

    const fileName = getReportFileName('Program');

    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    this.logger.info('END: getProgramReport controller');
    res.send(workbookBuffer);
  }

  /**
   * Get all program referrals
   */
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Permissions('read_all', ReferralView)
  @Get(':program_id/referrals')
  async getAllProgramReferrals(
    @Headers('user_id') userId: string,
    @Param('program_id') programId: string
  ) {
    this.logger.info('START: getAllProgramReferrals controller');

    const result = await this.programService.getAllProgramReferrals(userId, programId);

    this.logger.info('END: getAllProgramReferrals controller');
    return { message: 'Successfully got program referrals.', result };
  }
}
