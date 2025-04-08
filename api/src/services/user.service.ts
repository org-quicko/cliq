import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityNotFoundError } from 'typeorm';
import { CreateUserDto, SignUpUserDto, UpdateUserDto } from '../dtos';
import { ProgramUser, User } from '../entities';
import { UserConverter } from '../converters/user.converter';
import { LoggerService } from './logger.service';
import { userRoleEnum, statusEnum } from 'src/enums';

@Injectable()
export class UserService {
	public ability;

	constructor(
		@InjectRepository(User)
		private readonly userRepository: Repository<User>,

		@InjectRepository(ProgramUser)
		private readonly programUserRepository: Repository<ProgramUser>,

		private userConverter: UserConverter,

		private logger: LoggerService,
	) {
		this.ability = undefined;
	}

	async isFirstUserSignUp(): Promise<boolean> {
		const isFirstUser = (await this.userRepository.find()).length === 0;
		return isFirstUser;
	}

	/**
	 * User sign up
	 */
	async userSignUp(body: SignUpUserDto) {
		try {
			this.logger.info('START: userSignUp service');
	
			const userEntity = this.userRepository.create(body);
	
			if (await this.isFirstUserSignUp()) {
				userEntity.role = userRoleEnum.SUPER_ADMIN;
			}
	
			// has to be saved as an entity otherwise password hashing won't be triggered
			const newUser = await this.userRepository.save(userEntity);
	
			this.logger.info('END: userSignUp service');
			return this.userConverter.convert(newUser);
		
		} catch (error) {
			if (error instanceof Error) {
				this.logger.error(error.message);
				throw new InternalServerErrorException(error.message);
			}
		}
	}

	/**
	 * Get user
	 */
	async getUser(userId: string) {
		this.logger.info('START: getUser service');

		const userResult = await this.userRepository.findOne({
			where: { userId: userId },
			relations: { programUsers: true },
		});

		if (!userResult) {
			throw new EntityNotFoundError(User, userId);
		}

		this.logger.info('END: getUser service');
		return this.userConverter.convert(userResult);
	}

	async getUserEntity(userId: string) {
		this.logger.info('START: getUserEntity service');

		const userResult = await this.userRepository.findOne({
			where: { userId },
			relations: { programUsers: true },
		});

		if (!userResult) {
			throw new EntityNotFoundError(User, userId);
		}

		this.logger.info('END: getUserEntity service');
		return userResult;
	}

	async getUserByEmail(email: string) {
		this.logger.info('START: getUserByEmail service');

		const userResult = await this.userRepository.findOne({
			where: { email: email },
			relations: {
				programUsers: true,
			},
		});

		this.logger.info('END: getUserByEmail service');
		return userResult;
	}

	/**
	 * Update User info
	 */
	async updateUserInfo(userId: string, body: UpdateUserDto) {
		this.logger.info('START: updateUserInfo service');

		const userResult = await this.userRepository.findOne({
			where: { userId: userId },
		});

		if (!userResult) {
			throw new Error(`User does not exist.`);
		}

		await this.userRepository.update(
			{ userId: userId },
			{ ...body, updatedAt: () => `NOW()` },
		);
		this.logger.info('END: updateUserInfo service');
	}

	/**
	 * Delete user
	 */
	async deleteUser(userId: string) {
		this.logger.info('START: deleteUser service');

		const user = await this.userRepository.findOne({
			where: { userId: userId },
		});

		if (!user) {
			throw new Error(`User does not exist.`);
		}

		await this.userRepository.delete({ userId: userId });
		this.logger.info('END: deleteUser service');
	}

	async leaveProgram(userId: string, programId: string) {
		this.logger.info(`START: leaveProgram service`);

		const canLeave = await this.canLeaveProgram(programId, userId);
		if (!canLeave) {
			this.logger.error(`Error. Cannot leave program due to being the only admin/super admin in the program`);
			throw new BadRequestException(`Error. Cannot leave program due to being the only admin/super admin in the program`);
		}

		await this.programUserRepository.update({ programId, userId }, {
			status: statusEnum.INACTIVE
		});

		this.logger.info(`START: leaveProgram service`);
	}

	private async canLeaveProgram(programId: string, userId: string) {
		this.logger.info(`START: canLeaveProgram service`);

		const adminResult = await this.programUserRepository.find({
			where: {
				programId,
				role: userRoleEnum.ADMIN,
			}
		});

		const superAdminResult = await this.programUserRepository.findOne({
			where: {
				programId,
				role: userRoleEnum.SUPER_ADMIN
			}
		});

		let canLeave = true;

		if (adminResult.length > 1) {
			canLeave = true;
		}
		else if (adminResult.length === 0) {
			
			// only super admin is left
			if (superAdminResult) {
				canLeave = true;
			} else {
				canLeave = false;
			}
		}
		// at least 1 admin is present
		else if (adminResult.length === 1) {
			if (adminResult[0].userId === userId) {

				// no super admin, and the user is the only remaining admin => cannot leave the program
				if (!superAdminResult) {
					canLeave = false;
				} 
			} else {
				// this user ain't the admin, can leave 
				canLeave = true;
			}
		}

		this.logger.info(`END: canLeaveProgram service`);
		return canLeave;
	}
}
