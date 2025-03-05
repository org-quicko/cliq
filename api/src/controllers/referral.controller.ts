import { Controller, Get, Param } from "@nestjs/common";
import { LoggerService } from "../services/logger.service";
import { ApiResponse } from "@nestjs/swagger";
import { ReferralService } from "../services/referral.service";

@Controller('referrals/programs/:program_id')
export class ReferralController {

    constructor(
        private referralService: ReferralService,
        private logger: LoggerService,
    ) { }

    /**
     * Get all program referrals
     */
    @ApiResponse({ status: 201, description: 'OK' })
    @ApiResponse({ status: 400, description: 'Bad Request' })
    @Get()
    async getAllProgramReferrals(@Param('program_id') programId: string) {
        this.logger.info('START: getAllProgramReferrals controller');

        const result = await this.referralService.getAllProgramReferrals(programId);

        this.logger.info('END: getAllProgramReferrals controller');
        return { message: 'Successfully got program referrals.', result };
    }

    /**
     * Get promoter referrals, for a program
     */
    @ApiResponse({ status: 201, description: 'OK' })
    @ApiResponse({ status: 400, description: 'Bad Request' })
    @Get('/promoters/:promoter_id')
    async getPromoterReferrals(@Param('program_id') programId: string, @Param('promoter_id') promoterId: string) {
        this.logger.info('START: getPromoterReferrals controller');

        const result = await this.referralService.getPromoterReferrals(programId, promoterId);

        this.logger.info('END: getPromoterReferrals controller');
        return { message: 'Successfully got promoter referrals.', result };
    }
    
    /**
     * Get promoter statistics
     */
    @ApiResponse({ status: 200, description: 'OK' })
    @ApiResponse({ status: 400, description: 'Bad Request' })
    @Get('/promoters/:promoter_id/stats')
    async getPromoterStatistics(@Param('program_id') programId: string, @Param('promoter_id') promoterId: string) {
        this.logger.info('START: getPromoterStatistics controller');

        const result = await this.referralService.getPromoterStatistics(programId, promoterId);

        this.logger.info('END: getPromoterStatistics controller');
        return { message: 'Successfully got promoter statistics.', result };
    }
}