import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProgramPromoter } from '../entities';
import { Repository } from 'typeorm';
import winston from 'winston';
import { LoggerFactory } from '@org-quicko/core';

@Injectable()
export class ProgramPromoterService {
	private logger: winston.Logger = LoggerFactory.getLogger(ProgramPromoterService.name);
	constructor(
		@InjectRepository(ProgramPromoter)
		private programPromoterRepository: Repository<ProgramPromoter>,
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
