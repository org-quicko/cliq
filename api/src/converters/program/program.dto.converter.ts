import { Injectable } from '@nestjs/common';
import { ProgramDto } from '../../dtos';
import { Program } from '../../entities';
import { ConverterException } from '@org-quicko/core';
import winston from 'winston';
import { LoggerFactory } from '@org-quicko/core';

@Injectable()
export class ProgramConverter {
	private logger : winston.Logger = LoggerFactory.getLogger(ProgramConverter.name);

	constructor(
	) { }

	convert(program: Program): ProgramDto {
		try {
			this.logger.info(`START: convert function: ProgramConverter.`);
			const programDto = new ProgramDto();
			programDto.programId = program.programId;
			programDto.name = program.name;
			programDto.website = program.website;
			programDto.themeColor = program.themeColor;
			programDto.visibility = program.visibility;
			programDto.currency = program.currency;
			programDto.logoUrl = program.logoUrl;
			programDto.dateFormat = program.dateFormat;
			programDto.timeZone = program.timeZone;
			programDto.referralKeyType = program.referralKeyType;
			programDto.termsAndConditions = program.termsAndConditions;
			programDto.createdAt = program.createdAt;
			programDto.updatedAt = program.updatedAt;
			this.logger.info(`END: convert function: ProgramConverter.`);
			return programDto;
		} catch (error) {
			this.logger.error('Error in ProgramConverter:', error);
			throw new ConverterException('Error converting Program entity to ProgramDto', error);
		}
	}
}
