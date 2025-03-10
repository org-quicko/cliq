import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ReferralView, ReferralViewAggregate } from "src/entities";
import { Repository } from "typeorm";
import { LoggerService } from "./logger.service";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class ReferralService {
    constructor(
        @InjectRepository(ReferralView)
        private readonly referralViewRepository: Repository<ReferralView>,
        
        @InjectRepository(ReferralViewAggregate)
        private readonly referralViewAggregateRepository: Repository<ReferralViewAggregate>,
        
        private logger: LoggerService,
    ) { }

    async getFirstReferral(programId?: string, promoterId?: string) {
        this.logger.info(`START: getFirstProgramReferral service`);

        if (!programId && !promoterId) {
            this.logger.error(`Error. Must pass at least one of Program ID or Promoter ID to get referral result.`);
            throw new BadRequestException(`Error. Must pass at least one of Program ID or Promoter ID to get referral result.`);
        }

        const referralResult = await this.referralViewRepository.findOne({ 
            where: { 
                programId,
                promoterId,
            } 
        });

        if (!referralResult) {
            this.logger.error(`Error. Failed to get first referral for Program ID: ${programId}.`);
            throw new NotFoundException(`Error. Failed to get first link for Program ID: ${programId}.`);
        }

        this.logger.info(`END: getFirstProgramReferral service`);
        return referralResult;
    }
}