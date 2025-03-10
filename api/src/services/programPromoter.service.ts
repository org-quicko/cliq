import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProgramPromoter } from '../entities';
import { Repository } from 'typeorm';
import { LoggerService } from './logger.service';

@Injectable()
export class ProgramPromoterService {
	constructor(
		@InjectRepository(ProgramPromoter)
		private programPromoterRepository: Repository<ProgramPromoter>,

		private logger: LoggerService,
	) {}

	async getRandomProgramPromoter(programId: string) {
		this.logger.info('START: getProgramPromoterRowEntity service');

		const promoterMember = await this.programPromoterRepository.findOne({
			where: {
				programId,
			},
		});

		if (!promoterMember) {
			this.logger.error(
				`Error. Failed to get random programPromoter for program ID: ${programId}`,
			);
			throw new NotFoundException(
				`Error. Failed to get random programPromoter for program ID: ${programId}`,
			);
		}

		this.logger.info('END: getProgramPromoterRowEntity service');
		return promoterMember;
	}
}
