import { Injectable } from "@nestjs/common";
import { LoggerService } from "./logger.service";
import { DataSource, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { ReferralView } from "../entities";
import { ProgramService } from "./program.service";
import { PromoterService } from "./promoter.service";

@Injectable()
export class ReferralService {
    constructor(

        @InjectRepository(ReferralView)
        private readonly referralRepository: Repository<ReferralView>,

        private programService: ProgramService,
        private promoterService: PromoterService,

        private datasource: DataSource,

        private logger: LoggerService,
    ) { }

    async getAllProgramReferrals(programId: string) {
        this.logger.info(`START: getPromoterReferrals service`);

        await this.programService.getProgram(programId);

        const referralResult = await this.referralRepository.find({ where: { programId } });

        this.logger.info(`END: getPromoterReferrals service`);
        return referralResult;
    }

    async getPromoterReferrals(programId: string, promoterId: string) {
        this.logger.info(`START: getPromoterReferrals service`);
        
        // checking if the program and promoter exist
        await this.programService.getProgram(programId);
        await this.promoterService.getPromoter(promoterId);
        
        const referralResult = await this.referralRepository.find({ where: { promoterId } });
        
        this.logger.info(`END: getPromoterReferrals service`);
        return referralResult;
    }

    async getPromoterStatistics(programId: string, promoterId: string) {
        this.logger.info(`START: getPromoterStatistics service`);
        
        // checking if the program and promoter exist
        await this.programService.getProgram(programId);
        await this.promoterService.getPromoter(promoterId);
        
        const referralResult = await this.referralRepository
        .createQueryBuilder()
        .select('SUM(total_commission)', 'total_commission')
        .addSelect('SUM(total_revenue)', 'total_revenue')
        .where(`promoter_id = '${promoterId}'`)
        .andWhere(`program_id = '${programId}'`)
        .groupBy('promoter_id')
        .getRawOne();

        console.log(referralResult);

        let referralDto;
        if (!referralResult) {
            referralDto = {
                totalCommission: 0,
                totalRevenue: 0,
            };
        } else {
            referralDto = referralResult;
        }
        
        this.logger.info(`END: getPromoterStatistics service`);
        return referralDto;
    }
}