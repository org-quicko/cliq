import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, 
  // Logger
 } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { CircleService } from '../services/circle.service'
import { AddPromoterToCircleDto, CreateCircleDto } from '../dtos';
import { LoggerService } from 'src/services/logger.service';
import { Permissions } from 'src/decorators/permissions.decorator';
import { Circle, Promoter } from 'src/entities';
import { UnifiedAuthGuard } from 'src/guards/auth/auth.guard';
import { UnifiedPermissionsGuard } from 'src/guards/permissions/unifiedPermissions.guard';

@ApiTags('Circle')
@Controller('/programs/:program_id/circles')
@UseGuards(UnifiedAuthGuard, UnifiedPermissionsGuard)
export class CircleController {

  constructor(
    private readonly circleService: CircleService,
    private logger: LoggerService,
  ) { }


  /**
   * Create circle
   */
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Permissions('create', Circle)
  @Post()
  async createCircle(@Param('program_id') programId: string, @Body() body: CreateCircleDto) {
    this.logger.info('START: createCircle controller');

    const result = await this.circleService.createCircle(programId, body);
    
    this.logger.info('END: createCircle controller');
    return { message: "Circle created successfully", result };
  }

  /**
   * Get all circles
   */
  @Permissions('read', Circle)
  @Get()
  async getAllCircles(
    @Param('program_id') programId: string, 
    @Query('name') name?: string, 
    @Query('skip') skip: number = 0, 
    @Query('take') take: number = 10,
  ) {
    this.logger.info('START: getAllCircles controller');
    
    const result = await this.circleService.getAllCircles(programId, {
      name,
      skip,
      take
    });
    
    this.logger.info('END: getAllCircles controller');
    return { message: "Successfully fetched all circles.", result };
  }

  /**
   * Add promoters
   */
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Permissions('include_promoter', Circle)
  @Post(':circle_id/promoters')
  async addPromoter(@Param('circle_id') circleId: string, @Body() body: AddPromoterToCircleDto) {
    this.logger.info('START: addPromoter controller');
    
    await this.circleService.addPromoters(circleId, body);
    
    this.logger.info('END: addPromoter controller');
    return { message: "Successfully added promoters to circle." };
  }

  /**
   * Get all Promoters
   */
  @ApiResponse({ status: 200, description: 'OK' })
  @Permissions('read', Promoter)
  @Get(':circle_id/promoters')
  async getAllPromoters(
    @Param('circle_id') circleId: string,
    @Query('promoter_name') name?: string, 
    @Query('skip') skip: number = 0, 
    @Query('take') take: number = 10,
  ) {
    this.logger.info('START: getAllPromoters controller');
    
    const result = await this.circleService.getAllPromoters(circleId, {
      name,
      skip,
      take,
    });
    
    this.logger.info('END: getAllPromoters controller');
    return { message: "Successfully fetched promoters of circle.", result };
  }

  /**
   * Get circle
   */
  @ApiResponse({ status: undefined, description: '' })
  @Permissions('read', Circle)
  @Get(':circle_id')
  async getCircle(@Param('circle_id') circleId: string) {
    this.logger.info('START: getCircle controller');
    
    const result = await this.circleService.getCircle(circleId);
    
    this.logger.info('END: getCircle controller');
    return { message: "Successfully fetched circle.", result };
  }

  /**
   * Delete circle
   */
  @ApiResponse({ status: 204, description: 'No Content' })
  @Permissions('delete', Circle)
  @Delete(':circle_id')
  async deleteCircle(@Param('circle_id') circleId: string) {
    this.logger.info('START: deleteCircle controller');
    
    await this.circleService.deleteCircle(circleId);
    
    this.logger.info('END: deleteCircle controller');
    return { message: "Successfully deleted circle." }
  }

  /**
   * Remove promoter
   */
  @ApiResponse({ status: 204, description: 'No Content' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Permissions('remove_promoter', Circle)
  @Delete(':circle_id/promoters/:promoter_id')
  async removePromoter(@Param('circle_id') circleId: string, @Param('promoter_id') promoterId: string) {
    this.logger.info('START: removePromoter controller');
    
    await this.circleService.removePromoter(circleId, promoterId);
    
    this.logger.info('END: removePromoter controller');
    return { message: "Successfully removed promoter from circle." };
  }
}
