import { Injectable } from '@nestjs/common';
import { UserDto } from '../dtos';
import { ProgramUser, User } from '../entities';
import { ConverterException } from '@org-quicko/core';

@Injectable()
export class UserConverter {
	convert(user: User, programUser?: ProgramUser): UserDto {
		try {
			const userDto = new UserDto();

			userDto.userId = user.userId;

			userDto.email = user.email;
			//  not sending the password
			userDto.firstName = user.firstName;
			userDto.lastName = user.lastName;
			
			// Set role from ProgramUser if provided, otherwise from User entity
			if (programUser) {
				userDto.status = programUser.status;
				userDto.role = programUser.role;
			} else {
				userDto.role = user.role;
			}

			userDto.createdAt = new Date(user.createdAt);
			userDto.updatedAt = new Date(user.updatedAt);

			return userDto;
		} catch (error) {
			throw new ConverterException('Error converting User entity to UserDto', error);
		}
	}
}
