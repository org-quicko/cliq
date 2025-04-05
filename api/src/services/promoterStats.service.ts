import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PromoterStatsView } from 'src/entities';
import { Repository } from 'typeorm';
import { LoggerService } from './logger.service';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PromoterStatsService {
    constructor(

        @InjectRepository(PromoterStatsView)
        private readonly promoterStatsViewRepository: Repository<PromoterStatsView>,

        private logger: LoggerService,
    ) { }

    async getFirstPromoterStat(programId?: string, promoterId?: string) {
        this.logger.info(`START: getFirstPromoterStat service`);

        
        if (!programId && !promoterId) {
            this.logger.error(
                `Error. Must pass at least one of Program ID or Promoter ID to get promoter statistic result.`,
            );
            throw new BadRequestException(
                `Error. Must pass at least one of Program ID or Promoter ID to get promoter statistic result.`,
            );
        }

        const promoterStatResult =
            await this.promoterStatsViewRepository.findOne({
                where: {
                    programId,
                    promoterId,
                },
            });

        if (!promoterStatResult) {
            this.logger.warn(`Error. No promoter statistic found for Promoter ${promoterId} in Program ID: ${programId}.`);
            throw new NotFoundException(`Error. No promoter statistic found for Promoter ${promoterId} in Program ID: ${programId}.`);
        }

        this.logger.info(`END: getFirstPromoterStat service`);
        return promoterStatResult;
    }
}
