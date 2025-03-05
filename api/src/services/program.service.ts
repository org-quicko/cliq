import {
  Injectable, InternalServerErrorException,
  // Logger,
  NotFoundException
} from '@nestjs/common';
import { DataSource, FindOptionsRelations, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Commission, Program, Purchase, ReferralView, User } from '../entities';
import { CreateUserDto } from '../dtos';
import { ProgramUser } from '../entities/programUser.entity';
import { } from '../dtos/programUser.dto';
import { CreateProgramDto, UpdateProgramDto, UpdateProgramUserDto } from '../dtos';
import { InviteUserDto } from '../dtos/inviteUser.dto';
import { UserService } from './user.service';
import { ProgramPromoter } from '../entities/programPromoter.entity';
import { ProgramConverter } from '../converters/program.converter';
import { PromoterConverter } from '../converters/promoter.converter';
import { UserConverter } from '../converters/user.converter';
import { QueryOptionsInterface } from '../interfaces/queryOptions.interface';
import { ContactConverter } from '../converters/contact.converter';
import { PurchaseConverter } from '../converters/purchase.converter';
import { CommissionConverter } from '../converters/commission.converter';
import { roleEnum, statusEnum } from '../enums';
import { LoggerService } from './logger.service';
import { SignUpConverter } from 'src/converters/signUp.converter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GENERATE_DEFAULT_CIRCLE_EVENT, GenerateDefaultCircleEvent } from '../events/generateDefaultCircle.event';

@Injectable()
export class ProgramService {

  constructor(
    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,

    @InjectRepository(ProgramUser)
    private readonly programUserRepository: Repository<ProgramUser>,

    @InjectRepository(ProgramPromoter)
    private readonly programPromoterRepository: Repository<ProgramPromoter>,

    @InjectRepository(Purchase)
    private readonly purchaseRepository: Repository<Purchase>,

    @InjectRepository(ReferralView)
    private readonly referralRepository: Repository<ReferralView>,

    @InjectRepository(Commission)
    private readonly commissionRepository: Repository<Commission>,

    private userService: UserService,

    private programConverter: ProgramConverter,
    private promoterConverter: PromoterConverter,
    private userConverter: UserConverter,
    private contactConverter: ContactConverter,
    private signUpConverter: SignUpConverter,
    private purchaseConverter: PurchaseConverter,
    private commissionConverter: CommissionConverter,

    private datasource: DataSource,

    private eventEmitter: EventEmitter2,

    private logger: LoggerService,
  ) { }

  /**
   * Create program
   */
  async createProgram(userId: string, body: CreateProgramDto) {

    return this.datasource.transaction(async (manager) => {
      this.logger.info('START: createProgram service');

      const programRepository = manager.getRepository(Program);
      const programUserRepository = manager.getRepository(ProgramUser);

      const programEntity = programRepository.create(body);
      const savedProgram = await programRepository.save(programEntity);

      // set creator user to admin
      await programUserRepository.save({
        userId,
        programId: savedProgram.programId,
        role: roleEnum.ADMIN,
      });

      // create default circle for program
      const generateDefaultCircleEvent = new GenerateDefaultCircleEvent(savedProgram.programId);
      this.eventEmitter.emit(GENERATE_DEFAULT_CIRCLE_EVENT, generateDefaultCircleEvent);

      const programDto = this.programConverter.convert(savedProgram);
      this.logger.info('END: createProgram service');
      return programDto;
    });
  }

  /**
   * Get all programs
   */
  async getAllPrograms(queryOptions: QueryOptionsInterface = {}) {
    this.logger.info('Start getAllPrograms service');
    const findOptions: object = {};

    if (queryOptions.name) {
      findOptions['where'] = { name: queryOptions.name };
    }
    if (queryOptions.visibility) {
      findOptions['visibility'] = queryOptions.visibility;
    }
    if (queryOptions.skip) {
      findOptions['skip'] = queryOptions.skip;
    }
    if (queryOptions.take) {
      findOptions['take'] = queryOptions.take;
    }

    this.logger.info('End getAllPrograms service');
    return await this.programRepository.find(findOptions);
  }

  /**
   * Get program
   */
  async getProgram(programId: string) {
    this.logger.info('Start getProgram service');

    const programResult = await this.programRepository.findOne({
      where: { programId: programId }
    });

    if (!programResult) {
      this.logger.warn(`Program not found: ${programId}`);
      throw new NotFoundException(`Error. Program ${programId} not found.`);
    }

    this.logger.info('End getProgram service');
    return this.programConverter.convert(programResult);
  }

  /**
   * Get program entity
   */
  async getProgramEntity(programId: string, relations?: FindOptionsRelations<Program>) {
    this.logger.info('Start getProgramEntity service');

    const programResult = await this.programRepository.findOne({ where: { programId: programId }, relations });

    if (!programResult) {
      throw new NotFoundException(`Error. Program ${programId} not found.`);
    }

    this.logger.info('End getProgramEntity service');
    return programResult;
  }

  /**
   * Update program
   */
  async updateProgram(programId: string, body: UpdateProgramDto) {
    this.logger.info('Start updateProgram service');
    const programResult = await this.getProgramEntity(programId);

    if (!programResult) {
      throw new NotFoundException(`Error. Program ${programId} not found.`);
    }

    this.logger.info('End updateProgram service');
    await this.programRepository.update({ programId }, { ...body, updatedAt: () => `NOW()` });
  }

  /**
   * Forms relation between program and user
   */
  async relateProgramToUser(programId: string, userId: string) {
    this.logger.info('Start relateProgramToUser service');

    const newProgramUser = new ProgramUser();
    newProgramUser.programId = programId;
    newProgramUser.userId = userId;

    this.logger.info('End relateProgramToUser service');
    await this.programUserRepository.save(newProgramUser);
  }

  /**
   * Delete program
   */
  async deleteProgram(programId: string) {
    this.logger.info('Start deleteProgram service');
    if (await this.getProgramEntity(programId)) {
      await this.programRepository.delete({ programId });
      this.logger.info('End deleteProgram service');
    } else {
      this.logger.info('End deleteProgram service');
      throw new NotFoundException(`Error. Program ${programId} not found.`);
    }
  }

  /**
   * Invite user
   */
  async inviteUser(programId: string, body: InviteUserDto) {
    return this.datasource.transaction(async (manager) => {

      this.logger.info('Start inviteUser service');
      const user = await this.userService.getUserByEmail(body.email);

      let newUser: User;

      const programUserRepository = manager.getRepository(ProgramUser);
      const userRepository = manager.getRepository(User);

      // user doesn't exist, create account for 'em
      if (!user) {
        newUser = userRepository.create({
          email: body.email,
          password: body.password,
          firstName: body.firstName,
          lastName: body.lastName
        } as CreateUserDto);

        newUser = await userRepository.save(newUser);

        if (!newUser) {
          this.logger.error(`Error. Failed to create invited user.`);
          throw new InternalServerErrorException(`Error. Failed to create invited user.`);
        }
      } else {

        // does program-user relation exist?
        const programUserResult = await programUserRepository.findOne({ where: { programId, userId: user.userId } });
        if (programUserResult) {

          // if it does, is status active?
          // if both yes, throw error -> cannot invite user, since they're already part of the program
          if (programUserResult.status === statusEnum.ACTIVE) {
            this.logger.warn('Failed to invite user');
            throw new Error('Failed to invite user. User is already part of the program.');
          }

          // if relation exists but inactive, change status to active and return
          await programUserRepository.update(
            { programId, userId: user.userId },
            { status: statusEnum.ACTIVE, role: body.role ?? roleEnum.MEMBER, updatedAt: () => `NOW()` }
          );

          return;
        }

        // else create relation (below code snippets)
        newUser = user;
      }


      const programResult = await this.getProgramEntity(programId);

      if (!programResult) {
        this.logger.warn('program not found');
        throw new NotFoundException(`Error. Program ${programId} not found.`);
      }

      const newProgramUser = programUserRepository.create();
      newProgramUser.program = programResult;
      newProgramUser.user = newUser;
      newProgramUser.role = body.role ?? roleEnum.MEMBER;

      const result = await programUserRepository.save(newProgramUser);
      if (!result) {
        this.logger.error('Failed to invite user');
        throw new InternalServerErrorException('Failed to invite user.');
      }

      this.logger.info('End inviteUser service');
      return;

    });
  }

  /**
   * Get all users
   */
  async getAllUsers(programId: string, queryOptions: QueryOptionsInterface = {}) {
    this.logger.info('Start getAllUsers service');

    const whereOptions = {};

    if (queryOptions['role']) {
      whereOptions['role'] = queryOptions.role;
      delete queryOptions['role'];
    }
    if (queryOptions['status']) {
      whereOptions['status'] = queryOptions.status;
      delete queryOptions['status'];
    }

    const programUsersResult = await this.programUserRepository.find({
      where: { programId, ...whereOptions },
      relations: { user: true },
      ...queryOptions
    })

    if (!programUsersResult || programUsersResult.length === 0) {
      throw new NotFoundException(`Error. Users of Program ${programId} not found.`);
    }

    this.logger.info('End getAllUsers service');
    return programUsersResult.map(pu => this.userConverter.convert(pu.user, pu));
  }

  /**
   * Update role
   */
  async updateRole(programId: string, userId: string, body: UpdateProgramUserDto) {
    this.logger.info('Start updateRole service');
    const programUserResult = await this.programUserRepository.findOne({ where: { programId, userId } });

    if (!programUserResult) {
      throw new NotFoundException(`Error. Program ${programId} not found.`);
    }

    await this.programUserRepository.update({ programId, userId }, { role: body.role, updatedAt: () => `NOW()` });
    this.logger.info('End updateRole service');
  }

  /**
   * Remove user
   */
  async removeUser(programId: string, userId: string) {
    this.logger.info('Start removeUser service');

    const programUserResult = await this.programUserRepository.findOne({ where: { programId, userId } });

    if (!programUserResult) {
      throw new NotFoundException(`Error. Users of Program ${programId} not found.`);
    }

    await this.programUserRepository.update(
      { programId, userId },
      { ...programUserResult, status: statusEnum.INACTIVE, updatedAt: () => `NOW()` }
    );
    this.logger.info('End removeUser service');
  }

  async getProgramUserRowEntity(programId: string, userId: string) {
    const programUserResult = await this.programUserRepository.findOne({ where: { programId, userId } });

    if(!programUserResult) {
      throw new NotFoundException(`Error. Failed to get program user row of Program ID ${programId}, User ID ${userId}`);
    }

    return programUserResult;
  }

  /**
   * Get all promoters
   */
  async getAllPromoters(programId: string, queryOptions: QueryOptionsInterface = {}) {

    const whereOptions = {};
    if (queryOptions['name']) {
      whereOptions['name'] = queryOptions.name;
    }

    const programPromotersResult = await this.programPromoterRepository.find({
      where: { programId, promoter: { ...whereOptions } }, relations: { promoter: true }, ...queryOptions
    });

    if (!programPromotersResult) {
      throw new NotFoundException(`Error. Promoters of Program ${programId} not found.`);
    }

    return programPromotersResult.map(pp => this.promoterConverter.convert(pp.promoter));
  }

  /**
   * Get contacts in workspace
   */
  async getContactsInWorkspace(programId: string, queryOptions: QueryOptionsInterface = {}) {
    this.logger.info(`START: getContactsInWorkspace service`);

    const programResult = await this.programRepository.findOne({
      where: { programId },
      relations: {
        contacts: {
          program: true
        }
      },
      ...queryOptions
    });

    if (!programResult) {
      throw new NotFoundException(`Error. Contacts of Program ${programId} not found.`);
    }

    const contactDtos = programResult.contacts.map(contact => this.contactConverter.convert(contact));

    this.logger.info(`END: getContactsInWorkspace service`);
    return contactDtos;
  }

  /**
   * Get signups in workspace
   */
  async getSignUpsInWorkspace(programId: string, queryOptions: QueryOptionsInterface = {}) {
    this.logger.info(`START: getSignUpsInWorkspace service`);

    const programResult = await this.programRepository.findOne({
      where: { programId },
      relations: {
        contacts: {
          signup: {
            contact: true,
            promoter: true,
            link: true,
          }
        }
      },
      ...queryOptions
    });

    if (!programResult) {
      throw new NotFoundException(`Error. Signups of Program ${programId} not found.`);
    }

    const signUpDtos = programResult.contacts
      .filter(c => c.signup) // because not all contacts have signups
      .map(contact => this.signUpConverter.convert(contact.signup));

    this.logger.info(`END: getSignUpsInWorkspace service`);
    return signUpDtos;
  }

  /**
   * Get purchases in workspace
  */
  async getPurchasesInWorkspace(programId: string, queryOptions: QueryOptionsInterface = {}) {
    this.logger.info(`START: getPurchasesInWorkspace service`);

    const externalId = queryOptions.externalId;
    if (externalId) {
      delete queryOptions.externalId;
    }

    const purchases = await this.purchaseRepository.find({
      relations: {
        promoter: {
          programPromoters: {
            program: true
          }
        },
        link: true,
        contact: true,
      },
      where: {
        promoter: {
          programPromoters: {
            program: {
              programId
            }
          }
        },
        ...(externalId && { externalId })
      },
      ...queryOptions
    });

    if (!purchases) {
      throw new NotFoundException(`Error. Purchases of Program ${programId} not found.`);
    }

    const purchaseDtos = purchases.map(purchase => this.purchaseConverter.convert(purchase));

    this.logger.info(`END: getPurchasesInWorkspace service`);
    return purchaseDtos;
  }

  /**
   * Get all commissions
   */
  async getAllCommissions(programId: string, queryOptions: QueryOptionsInterface = {}) {
    this.logger.info(`START: getAllCommissions service`);

    const programResult = await this.programRepository.findOne({
      where: {
        programId
      },
      relations: {
        contacts: {
          commissions: true
        }
      },
      ...queryOptions
    });

    if (!programResult) {
      this.logger.warn(`Error. Program ${programId} not found.`);
      throw new NotFoundException(`Error. Program ${programId} not found.`);
    }

    let commissions: Commission[] = [];
    programResult.contacts.forEach(contact => {
      commissions = [...commissions, ...(contact.commissions)]
    });

    const commissionsDto = commissions.map(c => this.commissionConverter.convert(c));

    this.logger.info(`END: getAllCommissions service`);
    return commissionsDto;
  }

  async getAllProgramReferrals(programId: string) {
    this.logger.info(`START: getPromoterReferrals service`);

    await this.getProgram(programId);

    const referralResult = await this.referralRepository.find({ where: { programId } });

    this.logger.info(`END: getPromoterReferrals service`);
    return referralResult;
}
}
