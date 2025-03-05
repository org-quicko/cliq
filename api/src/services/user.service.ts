import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityNotFoundError } from 'typeorm';
import { CreateUserDto, UpdateUserDto } from '../dtos';
import { User } from '../entities';
import { UserConverter } from '../converters/user.converter';
import { LoggerService } from './logger.service';

@Injectable()
export class UserService {

  public ability;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

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
  async userSignUp(body: CreateUserDto) {

    this.logger.info('START: userSignUp service');

    const userEntity = this.userRepository.create(body);

    if (await this.isFirstUserSignUp()) {
      userEntity.isSuperAdmin = true;
    }

    // has to be saved as an entity otherwise password hashing won't be triggered
    const newUser = await this.userRepository.save(userEntity);

    if (!newUser) {
      throw new Error('Failed to sign up user.');
    }

    this.logger.info('END: userSignUp service');
    return newUser;
  }

  /**
   * User log in
   */
  // async userLogIn(user: UserDto) {
  //   try {
  //     const userRes = await this.userRepository.findOne({ where: { email: user.email } });

  //     if (!userRes) {
  //       throw new Error('User does not exist');
  //     }

  //     if (user.password !== userRes.password) {
  //       throw new Error('Incorrect password.');
  //     }

  //   } catch (error) {
  //     if (error instanceof Error) {
  //       this.logger.error(error.message);
  //       throw error;
  //     }
  //   }
  // }

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
      where: { userId: userId },
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
      // relations: [ProgramUser]
      relations: {
        programUsers: true,
      }
    });

    this.logger.info('END: getUserByEmail service');
    return userResult;
  }

  /**
   * Update User info
   */
  async updateUserInfo(userId: string, body: UpdateUserDto) {
    this.logger.info('START: updateUserInfo service');

    const userResult = await this.userRepository.findOne({ where: { userId: userId } });

    if (!userResult) {
      throw new Error(`User does not exist.`);
    }

    await this.userRepository.update({ userId: userId }, { ...body, updatedAt: () => `NOW()` });
    this.logger.info('END: updateUserInfo service');
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string) {
    this.logger.info('START: deleteUser service');

    const user = await this.userRepository.findOne({ where: { userId: userId } });

    if (!user) {
      throw new Error(`User does not exist.`);
    }

    await this.userRepository.delete({ userId: userId });
    this.logger.info('END: deleteUser service');
  }
}
