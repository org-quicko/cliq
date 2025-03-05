import {
  ConflictException, Injectable, InternalServerErrorException,
  // Logger,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Brackets } from 'typeorm';
import { Parser } from 'json2csv';
import * as fs from 'fs';
import {
  CreatePromoterDto,
  InviteMemberDto,
  UpdatePromoterMemberDto,
} from '../dtos';
import {
  Circle,
  CirclePromoter,
  Contact,
  ProgramPromoter,
  Promoter,
  PromoterMember,
  Purchase,
  ReferralView,
  SignUp,
} from '../entities';
import { MemberService } from './member.service';
import { PromoterConverter } from '../converters/promoter.converter';
import { PromoterMemberService } from './promoterMember.service';
import { MemberConverter } from '../converters/member.converter';
import { ContactConverter } from '../converters/contact.converter';
import { PurchaseConverter } from '../converters/purchase.converter';
import { QueryOptionsInterface } from '../interfaces/queryOptions.interface';
import * as path from 'path';
import { roleEnum, statusEnum } from '../enums';
import { LoggerService } from './logger.service';
import { SignUpConverter } from 'src/converters/signUp.converter';
import { CommissionConverter } from 'src/converters/commission.converter';
import { ProgramService } from './program.service';

@Injectable()
export class PromoterService {
  constructor(
    @InjectRepository(Promoter)
    private promoterRepository: Repository<Promoter>,

    @InjectRepository(PromoterMember)
    private promoterMemberRepository: Repository<PromoterMember>,

    @InjectRepository(Contact)
    private contactRepository: Repository<Contact>,

    @InjectRepository(SignUp)
    private signUpRepository: Repository<SignUp>,

    @InjectRepository(Purchase)
    private purchaseRepository: Repository<Purchase>,

    @InjectRepository(ReferralView)
    private referralRepository: Repository<ReferralView>,

    private programService: ProgramService,
    private memberService: MemberService,
    private promoterMemberService: PromoterMemberService,

    private promoterConverter: PromoterConverter,
    private memeberConverter: MemberConverter,
    private contactConverter: ContactConverter,
    private purchaseConverter: PurchaseConverter,
    private signUpConverter: SignUpConverter,
    private commissionConverter: CommissionConverter,

    private datasource: DataSource,

    private logger: LoggerService,
  ) { }

  /**
   * Create promoter
   */
  async createPromoter(memberId: string, programId: string, body: CreatePromoterDto) {

    return this.datasource.transaction(async (manager) => {
      this.logger.info('START: createPromoter service');

      const promoterRepository = manager.getRepository(Promoter);
      const programPromoterRepository = manager.getRepository(ProgramPromoter);
      const promoterMemberRepository = manager.getRepository(PromoterMember);
      const circleRepository = manager.getRepository(Circle);
      const circlePromoterRepository = manager.getRepository(CirclePromoter);

      const promoterEntity = promoterRepository.create(body);
      const savedPromoter = await promoterRepository.save(promoterEntity);

      // set creator member to admin
      await promoterMemberRepository.save({
        memberId,
        promoterId: savedPromoter.promoterId,
        role: roleEnum.ADMIN,
      });

      // form the relation
      await programPromoterRepository.save({
        programId,
        promoterId: savedPromoter.promoterId
      });

      // add to program's default circle
      const defaultCircle = await circleRepository.findOne({
        where: {
          program: {
            programId
          },
          isDefaultCircle: true
        }
      });

      if (!defaultCircle) {
        this.logger.error(`Error. Default Circle not found for Program ${programId}`);
        throw new InternalServerErrorException(`Error. Default Circle not found for Program ${programId}`);
      }

      await circlePromoterRepository.save({
        circleId: defaultCircle.circleId,
        promoterId: savedPromoter.promoterId,
      });

      const promoterDto = this.promoterConverter.convert(savedPromoter);
      this.logger.info('END: createPromoter service');
      return promoterDto;
    });
  }

  /**
   * Get promoter
   */
  async getPromoter(promoterId: string) {
    this.logger.info('Start getPromoter service');
    const promoter = await this.promoterRepository.findOne({
      where: {
        promoterId,
      }
    });

    if (!promoter) {
      this.logger.warn(`Failed to get Promoter ${promoterId}`);
      throw new NotFoundException(`Failed to get promoter for promoter_id: ${promoterId}`);
    }

    this.logger.info('End getPromoter service');
    return this.promoterConverter.convert(promoter);
  }
  
  /**
   * Get promoter entity
   */
  async getPromoterEntity(promoterId: string) {
    this.logger.info('Start getPromoterEntity service');
    const promoter = await this.promoterRepository.findOne({
      where: {
        promoterId,
      }
    });

    if (!promoter) {
      this.logger.warn(`Failed to get Promoter ${promoterId}`);
      throw new NotFoundException(`Failed to get promoter for promoter_id: ${promoterId}`);
    }

    this.logger.info('End getPromoterEntity service');
    return promoter;
  }

  /**
   * Invite member
   */
  async inviteMember(
    programId: string,
    promoterId: string,
    body: InviteMemberDto,
  ) {
    this.logger.info('Start inviteMember service');
    return this.datasource.transaction(async (manager) => {
      // First check if member exists
      const existingMember = await this.memberService.memberExists(
        body.email,
        programId,
      );
      console.log("existingMember:", existingMember);
      if (existingMember) {
        // Check if there's an existing promoter-member relationship
        const promoterMember = await this.promoterMemberService.getPromoterMemberRowEntity(
          promoterId,
          existingMember.memberId
        );
        console.log("promoter_member:", promoterMember)
        // If promoter-member relationship exists
        if (promoterMember) {
          // Only allow reactivation if status is INACTIVE
          if (promoterMember.status === statusEnum.INACTIVE) {
            await this.promoterMemberRepository.update(
              {
                promoterId: promoterMember.promoterId,
                memberId: promoterMember.memberId
              },
              {
                status: statusEnum.ACTIVE,
                updatedAt: Date.now()
              }
            );

            return {
              email: existingMember.email,
              firstName: existingMember.firstName,
              lastName: existingMember.lastName,
              role: promoterMember.role,
            } as InviteMemberDto;
          }

          throw new ConflictException('Member is already active for this promoter');
        }

        // If no promoter-member relationship exists, create one
        const newPromoterMember = manager.create(PromoterMember, {
          memberId: existingMember.memberId,
          promoterId,
          role: body.role,
          status: statusEnum.ACTIVE
        });

        await manager.save(newPromoterMember);

        return {
          email: existingMember.email,
          firstName: existingMember.firstName,
          lastName: existingMember.lastName,
          role: newPromoterMember.role,
        } as InviteMemberDto;
      }

      // If member doesn't exist, create new member and promoter-member relationship
      const newMember = await this.memberService.memberSignUp(programId, {
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        password: body.password,
      });

      if (!newMember || !newMember.memberId) {
        this.logger.warn('Failed to create member');
        throw new InternalServerErrorException('Failed to create member');
      }

      const promoterMember = manager.create(PromoterMember, {
        memberId: newMember.memberId,
        promoterId,
        role: body.role,
        status: statusEnum.ACTIVE
      });

      await manager.save(promoterMember);

      this.logger.info('End inviteMember service');

      return {
        email: newMember.email,
        firstName: newMember.firstName,
        lastName: newMember.lastName,
        role: promoterMember.role,
      } as InviteMemberDto;
    });
  }

  /**
   * Get all members
   */
  async getAllMembers(promoterId: string, queryOptions: QueryOptionsInterface = {}) {

    this.logger.info('Start getAllMembers service');

    const whereOptions = {};

    if (queryOptions['role']) {
      whereOptions['role'] = queryOptions.role;
      delete queryOptions['role'];
    }
    if (queryOptions['status']) {
      whereOptions['status'] = queryOptions.status;
      delete queryOptions['status'];
    }

    const promoterMembers = await this.promoterMemberRepository.find({
      where: {
        promoter: {
          promoterId: promoterId
        },
        ...whereOptions
      },
      relations: {
        member: true,
      },
      select: {
        member: {
          email: true,
          firstName: true,
          lastName: true
        },
      },
      ...queryOptions
    });

    console.log(promoterMembers);

    if (!promoterMembers || promoterMembers.length == 0) {
      this.logger.warn(`Failed to get members for Promoter ${promoterId}`);
      throw new NotFoundException(`Failed to get members for promoter_id: ${promoterId}`);
    }

    this.logger.info('End getAllMembers service');

    return promoterMembers.map((pm) => this.memeberConverter.convert(pm.member, pm));
  }

  /**
   * Update role
   */
  async updateRole(
    memberId: string,
    body: UpdatePromoterMemberDto,
  ) {

    this.logger.info('Start updateRole service');

    const member = await this.memberService.getMember(memberId);

    if (!member) {
      this.logger.warn(`failed to get Member ${memberId}`);
      throw new NotFoundException('Failed to get member');
    }

    await this.promoterMemberRepository.update({
      memberId
    }, {
      role: body.role, 
      updatedAt: () => `NOW()`    
    });
    this.logger.info('End updateRole service');
  }

  /**
   * Remove member
   */
  async removeMember(promoterId: string, memberId: string) {
    this.logger.info('Start removeMember service')
    return await this.promoterMemberRepository.update(
      {
        promoterId,
        memberId,
      },
      { status: statusEnum.INACTIVE, updatedAt: () => `NOW()` },
    );
  }

  /**
   * Get signups for promoter
   */
  async getSignUpsForPromoter(programId: string, promoterId: string, queryOptions: QueryOptionsInterface = {}) {
    this.logger.info('Start getSignUpsForPromoter service');

    // getting signups for: program -> promoter -> signups
    const signUpsResult = await this.signUpRepository.find({
      where: {
        promoterId,
        promoter: {
          programPromoters: {
            program: {
              programId
            }
          }
        }
      },
      relations: {
        contact: true
      },
      ...queryOptions
    });

    if (!signUpsResult || signUpsResult.length === 0) {
      this.logger.warn(`failed to get signups for promoter ${promoterId}`);
      throw new NotFoundException(`No signups found for promoter ${promoterId}`);
    }

    const signUpDtos = signUpsResult.map(signUp => this.signUpConverter.convert(signUp));

    this.logger.info('End getSignUpsForPromoter service');
    return signUpDtos;
  }

  /**
   * Get contacts for promoter
   */
  async getContactsForPromoter(programId: string, promoterId: string, queryOptions: QueryOptionsInterface = {}) {
    this.logger.info('Start getContactsForPromoter service')

    const contacts = await this.contactRepository
      .createQueryBuilder('contact')
      .leftJoinAndSelect('contact.program', 'program')
      .leftJoinAndSelect('contact.purchases', 'purchase')
      .leftJoinAndSelect('contact.signup', 'signup')
      .where('program.program_id = :programId', { programId })
      .andWhere(
        new Brackets((qb) => {
          qb.where('purchase.promoter_id = :promoterId', { promoterId })
            .orWhere('signup.promoter_id = :promoterId', { promoterId });
        }),
      )
      .getMany();


    if (!contacts || contacts.length === 0) {
      this.logger.warn(`failed to get contacts for promoter ${promoterId}`);
      throw new NotFoundException(`No contacts found for promoter ${promoterId}`);
    }

    const contactDtos = contacts.map((contact) => this.contactConverter.convert(contact));

    this.logger.info('End getContactsForPromoter service');
    return contactDtos;
  }

  /**
   * Get purchases for promoter
   */
  async getPurchasesForPromoter(programId: string, promoterId: string, queryOptions: QueryOptionsInterface = {}) {

    this.logger.info('Start getPurchasesForPromoter service');

    const whereOptions = {};

    if (queryOptions['externalId']) {
      whereOptions['externalId'] = queryOptions.externalId;
      delete queryOptions['externalId'];
    }

    const purchases = await this.purchaseRepository.find({
      where: {
        promoter: {
          promoterId,
        },
        ...whereOptions
      },
      select: {
        purchaseId: true,
        amount: true,
        externalId: true,
        contact: {
          contactId: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
        createdAt: true,
      },
      relations: {
        link: true,
        contact: true,
      },
      ...queryOptions
    });

    if (!purchases || purchases.length == 0) {
      this.logger.warn(`failed to get purchases for promoter ${promoterId}`);
      throw new NotFoundException(`No purchases found for ${promoterId}`);
    }

    this.logger.info('End getPurchasesForPromoter service');

    const result = purchases.map((purchase) => this.purchaseConverter.convert(purchase));
    return result;
  }

  /**
   * Get promoter commissions
   */
  async getPromoterCommissions(programId: string, promoterId: string, queryOptions: QueryOptionsInterface = {}) {
    this.logger.info('START: getPromoterCommissions service');

    const promoterResult = await this.promoterRepository.findOne({
      where: {
        promoterId,
        programPromoters: {
          program: {
            programId
          }
        }
      },
      relations: {
        commissions: true
      },
      ...queryOptions
    });

    if (!promoterResult || !promoterResult.commissions || promoterResult.commissions.length === 0) {
      this.logger.warn(`failed to get commissions for promoter ${promoterId}`);
      throw new NotFoundException(`No commissions found for promoter ${promoterId}`);
    }

    const commissionDtos = promoterResult.commissions.map(commission => this.commissionConverter.convert(commission));

    this.logger.info('END: getPromoterCommissions service');
    return commissionDtos;
  }

  /**
   * Get contacts report
   */
  async getContactsReport(programId: string, promoterId: string) {
    this.logger.info('START: getContactsReport service');

    const contactsResult = await this.getContactsForPromoter(programId, promoterId);

    const fields = ['contactId', 'firstName', 'lastName', 'email', 'phone', 'createdAt'];
    const parser = new Parser({ fields });
    const csv = parser.parse(contactsResult);

    const publicDir = path.resolve(__dirname, '..', '..', 'public');

    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const fileName = `contacts_${Date.now()}.csv`;
    const filePath = path.join(publicDir, fileName);

    fs.writeFileSync(filePath, csv);

    this.logger.info('END: getContactsReport service');
    return filePath;
  }

  /**
   * Get purchases report
   */
  async getPurchasesReport(programId: string, promoterId: string) {
    this.logger.info('Start getPurchasesReport service');

    const purchasesResult = await this.getPurchasesForPromoter(programId, promoterId);

    const fields = ['contactId', 'firstName', 'lastName', 'email', 'phone', 'createdAt', 'amount', 'externalId', 'linkId'];
    const parser = new Parser({ fields });
    const csv = parser.parse(purchasesResult);


    const publicDir = path.resolve(__dirname, '..', '..', 'public');

    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const fileName = `purchases_${Date.now()}.csv`;
    const filePath = path.join(publicDir, fileName);
    fs.writeFileSync(filePath, csv);

    this.logger.info('End getPurchasesReport service');
    return filePath;

  }

  /**
   * Get referrals report
   */
  async getReferralsReport(programId: string, promoterId: string) {
    this.logger.info('Start getPurchasesReport service');

    const purchasesResult = await this.getPromoterReferrals(programId, promoterId);

    const fields = ['contactId', 'firstName', 'lastName', 'email', 'phone', 'createdAt', 'amount', 'externalId', 'linkId'];
    const parser = new Parser({ fields });
    const csv = parser.parse(purchasesResult);


    const publicDir = path.resolve(__dirname, '..', '..', 'public');

    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const fileName = `purchases_${Date.now()}.csv`;
    const filePath = path.join(publicDir, fileName);
    fs.writeFileSync(filePath, csv);

    this.logger.info('End getPurchasesReport service');
    return filePath;

  }

  async getPromoterReferrals(programId: string, promoterId: string) {
    this.logger.info(`START: getPromoterReferrals service`);

    // checking if the program and promoter exist
    await this.programService.getProgram(programId);
    await this.getPromoter(promoterId);

    const referralResult = await this.referralRepository.find({ where: { promoterId } });

    this.logger.info(`END: getPromoterReferrals service`);
    return referralResult;
  }

  async getPromoterStatistics(programId: string, promoterId: string) {
    this.logger.info(`START: getPromoterStatistics service`);

    // checking if the program and promoter exist
    await this.programService.getProgram(programId);
    await this.getPromoter(promoterId);

    const referralResult = await this.referralRepository
      .createQueryBuilder()
      .select('SUM(total_commission)', 'total_commission')
      .addSelect('SUM(total_revenue)', 'total_revenue')
      .where(`promoter_id = '${promoterId}'`)
      .andWhere(`program_id = '${programId}'`)
      .groupBy('promoter_id')
      .getRawOne();

    // TODO
    let referralDto;
    if (!referralResult) {
      referralDto = {
        totalCommission: 0,
        totalRevenue: 0,
      };
    } else {
      referralDto = referralResult;
    }

    this.logger.info(`END: getPromoterStatistics service`);
    return referralDto;
  }
}
