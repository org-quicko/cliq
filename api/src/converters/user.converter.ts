import { Injectable } from '@nestjs/common';
import { UserDto } from '../dtos';
import { ProgramUser, User } from '../entities';

@Injectable()
export class UserConverter {
	convert(user: User, programUser?: ProgramUser): UserDto {
		const userDto = new UserDto();

		userDto.userId = user.userId;

		userDto.email = user.email;
		//  not sending the password
		userDto.firstName = user.firstName;
		userDto.lastName = user.lastName;
		// userDto.role = programUser?.role;

		if (programUser) {
			userDto.status = programUser.status;
			userDto.role = programUser.role;
		}

		userDto.createdAt = new Date(user.createdAt);
		userDto.updatedAt = new Date(user.updatedAt);

		return userDto;
	}
}
