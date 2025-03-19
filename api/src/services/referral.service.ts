import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ReferralView, ReferralAggregateView } from 'src/entities';
import { Repository } from 'typeorm';
import { LoggerService } from './logger.service';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ReferralService {
    constructor(
        @InjectRepository(ReferralView)
        private readonly referralViewRepository: Repository<ReferralView>,

        @InjectRepository(ReferralAggregateView)
        private readonly referralViewAggregateRepository: Repository<ReferralAggregateView>,

        private logger: LoggerService,
    ) { }

    async getFirstReferral(programId?: string, promoterId?: string) {
        this.logger.info(`START: getFirstReferral service`);

        if (!programId && !promoterId) {
            this.logger.error(
                `Error. Must pass at least one of Program ID or Promoter ID to get referral result.`,
            );
            throw new BadRequestException(
                `Error. Must pass at least one of Program ID or Promoter ID to get referral result.`,
            );
        }

        
        const referralResult = await this.referralViewRepository.findOne({
            where: {
                ...(programId && { programId }),
				...(promoterId && { promoterId }),
            },
        });

        if (!referralResult) {
            this.logger.warn(`No Referrals found${promoterId ? ` for Promoter ${promoterId}` : ''} in Program ${programId}`);
			throw new NotFoundException(`No Referrals found${promoterId ? ` for Promoter ${promoterId}` : ''} in Program ${programId}`);
        }

        this.logger.info(`END: getFirstReferral service`);
        return referralResult;
    }

    async getFirstReferralAggregate(programId?: string, promoterId?: string) {
        this.logger.info(`START: getFirstReferralAggregate service`);

        
        if (!programId && !promoterId) {
            this.logger.error(
                `Error. Must pass at least one of Program ID or Promoter ID to get referral aggregate result.`,
            );
            throw new BadRequestException(
                `Error. Must pass at least one of Program ID or Promoter ID to get referral aggregate result.`,
            );
        }

        const referralAggregateResult =
            await this.referralViewAggregateRepository.findOne({
                where: {
                    programId,
                    promoterId,
                },
            });

        if (!referralAggregateResult) {
            this.logger.error(`Error. Failed to get first referral aggregate for Program ID: ${programId}.`);
            throw new BadRequestException(`Error. Failed to get first referral aggregate for Program ID: ${programId}.`);
        }

        this.logger.info(`END: getFirstReferralAggregate service`);
        return referralAggregateResult;
    }
}
