import { Controller, Get, Post, Delete, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import { CreateUserDto, SignUpUserDto, UpdateUserDto } from '../dtos';
import { LoggerService } from '../services/logger.service';
import { Program, User } from '../entities';
import { plainToInstance } from 'class-transformer';
import { UserAuthService } from '../services/userAuth.service';
import { Permissions } from '../decorators/permissions.decorator';
import { Public } from 'src/decorators/public.decorator';

@ApiTags('User')
@Controller('/users')
export class UserController {
	constructor(
		private userService: UserService,
		private userAuthService: UserAuthService,
		private logger: LoggerService,
	) {}

	/**
	 * User sign up
	 */
	@ApiResponse({ status: 201, description: 'Created' })
	@Public()
	@Post('signup')
	async userSignUp(@Body() body: SignUpUserDto) {
		this.logger.info('START: userSignUp controller');

		const result = await this.userService.userSignUp(body);

		this.logger.info('END: userSignUp controller');
		return { message: 'Successfully signed up user.', result };
	}

	/**
	 * User log in
	 */
	@ApiResponse({ status: 200, description: 'OK' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@Public()
	@Post('login')
	async login(@Body() body: any) {
		this.logger.info('START: login controller');

		const transformedBody = plainToInstance(CreateUserDto, body);

		const result = await this.userAuthService.authenticateUser({
			email: transformedBody.email,
			password: transformedBody.password,
		});

		this.logger.info('END: login controller');
		return { message: 'Successfully logged in user.', result };
	}

	/**
	 * Get user
	 */
	@ApiResponse({ status: 200, description: 'OK' })
	@Permissions('read', User)
	@Get(':user_id')
	async getUser(@Param('user_id') userId: string) {
		this.logger.info('START: getUser controller');

		const result = await this.userService.getUser(userId);

		this.logger.info('END: getUser controller');
		return { message: 'Successfully got user information.', result };
	}

	/**
	 * Update User info
	 */
	@ApiResponse({ status: 204, description: 'No Content' })
	@Permissions('update', User)
	@Patch(':user_id')
	async updateUserInfo(
		@Param('user_id') userId: string,
		@Body() body: UpdateUserDto,
	) {
		this.logger.info('START: updateUserInfo controller');

		const result = await this.userService.updateUserInfo(userId, body);

		this.logger.info('END: updateUserInfo controller');
		return { message: 'Successfully updated user information.', result };
	}

	/**
	 * Delete user
	 */
	@ApiResponse({ status: 204, description: 'No Content' })
	@Permissions('delete', User)
	@Delete(':user_id')
	async deleteUser(@Param('user_id') userId: string) {
		this.logger.info('START: deleteUser controller');

		await this.userService.deleteUser(userId);

		this.logger.info('END: deleteUser controller');
		return { message: 'Successfully deleted user.' };
	}

	/**
	 * Leave program
	 */
	@ApiResponse({ status: 204, description: 'No Content' })
	@Permissions('leave', Program)
	@Patch(':user_id/programs/:program_id')
	async leaveProgram(
		@Param('user_id') userId: string,
		@Param('program_id') programId: string,
	) {
		this.logger.info('START: leaveProgram controller');

		const result = await this.userService.leaveProgram(userId, programId);

		this.logger.info('END: leaveProgram controller');
		return { message: `Successfully left program ${programId}.`, result };
	}
}
