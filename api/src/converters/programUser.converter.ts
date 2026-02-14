import { Injectable } from '@nestjs/common';
import { ProgramUserDto } from '../dtos';
import { ProgramUser, Program } from '../entities';
import { ConverterException } from '@org-quicko/core';
import { ProgramConverter } from './program/program.dto.converter';

@Injectable()
export class ProgramUserConverter {
	constructor(private programConverter: ProgramConverter) {}

	convert(programUser: ProgramUser, program?: Program): ProgramUserDto {
		try {
			const programUserDto = new ProgramUserDto();

			programUserDto.programId = programUser.programId;

			if (program) {
				programUserDto.program = this.programConverter.convert(program);
			}

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
