import { Injectable } from '@nestjs/common';
import { ProgramDto } from '../dtos';
import { Program } from '../entities';

@Injectable()
export class ProgramConverter {
	// from entity to DTO (DTO for response, i.e.)
	convert(program: Program): ProgramDto {
		const programDto = new ProgramDto();

		programDto.programId = program.programId;

		programDto.name = program.name;
		programDto.website = program.website;
		programDto.themeColor = program.themeColor;
		programDto.visibility = program.visibility;
		programDto.currency = program.currency;
		programDto.dateFormat = program.dateFormat;
		programDto.timeZone = program.timeZone;

		programDto.createdAt = program.createdAt;
		programDto.updatedAt = program.updatedAt;

		return programDto;
	}
}
