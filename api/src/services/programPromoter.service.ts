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
