import { Injectable } from '@nestjs/common';
import { ProgramUserDto } from '../dtos';
import { ProgramUser } from '../entities';
import { ConverterException } from '@org-quicko/core';

@Injectable()
export class ProgramUserConverter {
	convert(programUser: ProgramUser): ProgramUserDto {
		try {
			const programUserDto = new ProgramUserDto();

			programUserDto.programId = programUser.programId;

			programUserDto.userId = programUser.userId;
			programUserDto.status = programUser.status;
			programUserDto.role = programUser.role;

			programUserDto.createdAt = new Date(programUser.createdAt);
			programUserDto.updatedAt = new Date(programUser.updatedAt);

			return programUserDto;
		} catch (error) {
			throw new ConverterException('Error converting ProgramUser entity to ProgramUserDto', error);
		}
	}
}
