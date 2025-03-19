import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
	) { }

	async getFirstProgramPromoter(programId: string) {
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

	async getProgramPromoter(programId: string, promoterId: string) {
		const programPromoterResult = await this.programPromoterRepository.findOne({
			where: {
				programId,
				promoterId,
			}
		});

		if (!programPromoterResult) {
			throw new BadRequestException(`Error. Promoter ${promoterId} does not exist in Program ${programId}.`);
		}

		return programPromoterResult;
	}
}
