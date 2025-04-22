import {
	ConflictException,
	ForbiddenException,
	forwardRef,
	Inject,
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { DataSource, FindOptionsRelations, Repository, FindOptionsWhere } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Circle, Commission, Program, Promoter, Purchase, ReferralView, User } from '../entities';
import { CreateUserDto } from '../dtos';
import { ProgramUser } from '../entities/programUser.entity';
import {
	CreateProgramDto,
	UpdateProgramDto,
	UpdateProgramUserDto,
} from '../dtos';
import { UserService } from './user.service';
import { ProgramPromoter } from '../entities/programPromoter.entity';
import { ProgramConverter } from '../converters/program.converter';
import { PromoterConverter } from '../converters/promoter.converter';
import { UserConverter } from '../converters/user.converter';
import { QueryOptionsInterface } from '../interfaces/queryOptions.interface';
import { PurchaseConverter } from '../converters/purchase.converter';
import { CommissionConverter } from '../converters/commission.converter';
import { userRoleEnum, statusEnum, visibilityEnum } from '../enums';
import { LoggerService } from './logger.service';
import { SignUpConverter } from 'src/converters/signUp.converter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';
import { SALT_ROUNDS } from 'src/constants';
import * as XLSX from 'xlsx';
import { defaultQueryOptions } from 'src/constants';
import { snakeCaseToHumanReadable } from 'src/utils';
import { CircleService } from './circle.service';
import { ProgramWorkbook } from 'generated/sources/Program';
import { ReferralConverter } from 'src/converters/referral.converter';

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
		private readonly referralViewRepository: Repository<ReferralView>,

		private userService: UserService,

		@Inject(forwardRef(() => CircleService))
		private circleService: CircleService,

		private programConverter: ProgramConverter,
		private promoterConverter: PromoterConverter,
		private userConverter: UserConverter,
		private signUpConverter: SignUpConverter,
		private purchaseConverter: PurchaseConverter,
		private commissionConverter: CommissionConverter,
		private referralConverter: ReferralConverter,

		private datasource: DataSource,

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
			const circleRepository = manager.getRepository(Circle);

			const programEntity = programRepository.create(body);
			const savedProgram = await programRepository.save(programEntity);

			const programUser = programUserRepository.create({
				userId,
				programId: savedProgram.programId,
				role: userRoleEnum.SUPER_ADMIN,
			});
			// set creator user to super admin
			await programUserRepository.save(programUser);

			const circle = circleRepository.create({
				name: 'DEFAULT_CIRCLE',
				isDefaultCircle: true,
				program: savedProgram,
			});
			await circleRepository.save(circle);

			const programDto = this.programConverter.convert(savedProgram);

			this.logger.info('END: createProgram service');
			return programDto;
		});
	}

	/**
	 * Get all programs
	 */
	async getAllPrograms(whereOptions: FindOptionsWhere<Program> = {}, queryOptions: QueryOptionsInterface = defaultQueryOptions) {
		this.logger.info('START: getAllPrograms service');

		const programResult = await this.programRepository.find({
			where: {
				...whereOptions
			},
			...queryOptions
		})

		this.logger.info('END: getAllPrograms service');
		return programResult;
	}

	/**
	 * Get program
	 */
	async getProgram(programId: string) {
		this.logger.info('START: getProgram service');

		const programResult = await this.programRepository.findOne({
			where: { programId: programId },
		});

		if (!programResult) {
			this.logger.warn(`Error. Program ${programId} not found.`);
			throw new NotFoundException(`Error. Program ${programId} not found.`);
		}

		this.logger.info('END: getProgram service');
		return this.programConverter.convert(programResult);
	}

	/**
	 * Get program entity
	 */
	async getProgramEntity(
		programId: string,
		whereOptions: FindOptionsWhere<Program> = {},
		relations: FindOptionsRelations<Program> = {},
	) {
		this.logger.info('START: getProgramEntity service');

		const programResult = await this.programRepository.findOne({
			where: { 
				programId,
				...whereOptions
			},
			relations,
		});

		if (!programResult) {
			this.logger.error(`Error. Program ${programId} not found.`);
			throw new NotFoundException(`Error. Program ${programId} not found.`);
		}

		this.logger.info('END: getProgramEntity service');
		return programResult;
	}

	async isProgramPublic(programId: string): Promise<boolean> {
		this.logger.info('START: isProgramPublic service');

		const program = await this.programRepository.findOne({ 
			where: {
				programId,
				visibility: visibilityEnum.PUBLIC
			} 
		});

		const isPublic = (program === undefined || program === null);

		this.logger.info('START: isProgramPublic service');
		return isPublic;
	}

	/**
	 * Update program
	 */
	async updateProgram(programId: string, body: UpdateProgramDto) {
		this.logger.info('START: updateProgram service');
		const programResult = await this.getProgramEntity(programId);

		if (!programResult) {
			throw new NotFoundException(`Error. Program ${programId} not found.`);
		}

		this.logger.info('END: updateProgram service');
		await this.programRepository.update(
			{ programId },
			{ ...body, updatedAt: () => `NOW()` },
		);
	}

	/**
	 * Delete program
	 */
	async deleteProgram(programId: string) {
		this.logger.info('START: deleteProgram service');
		if (await this.getProgramEntity(programId)) {
			await this.programRepository.delete({ programId });
			this.logger.info('END: deleteProgram service');
		} else {
			this.logger.info('END: deleteProgram service');
			throw new NotFoundException(
				`Error. Program ${programId} not found.`,
			);
		}
	}

	/**
	 * Add user
	 */
	async addUser(programId: string, body: CreateUserDto) {
		return this.datasource.transaction(async (manager) => {
			this.logger.info('START: addUser service');
			const programResult = await this.getProgramEntity(programId);

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
					lastName: body.lastName,
				});

				newUser = await userRepository.save(newUser);
			} else {
				// does program-user relation exist?
				const programUserResult = await this.checkIfUserExistsInProgram(
					programId,
					user.userId,
				);

				if (programUserResult) {
					// if it does, is status active?
					// if both yes, throw error -> cannot invite user, since they're already part of the program
					if (programUserResult.status === statusEnum.ACTIVE) {
						const message = 'Failed to invite user. User is already part of the program.';
						this.logger.warn(message);
						throw new ConflictException(message);
					}

					const salt = await bcrypt.genSalt(SALT_ROUNDS);
					user.password = await bcrypt.hash(body.password, salt);

					Object.assign(user, { firstName: body.firstName, lastName: body.lastName });

					await userRepository.save(user);

					// if relation exists but inactive, change status to active and return
					await programUserRepository.update(
						{
							programId,
							userId: user.userId
						},
						{
							status: statusEnum.ACTIVE,
							role: body.role ?? userRoleEnum.VIEWER,
							updatedAt: () => `NOW()`,
						},
					);

					return;
				}

				// else create relation (below code snippets)
				newUser = user;
			}


			const newProgramUser = programUserRepository.create({
				program: programResult,
				user: newUser,
				role: body.role ?? userRoleEnum.VIEWER
			});

			await programUserRepository.save(newProgramUser);

			this.logger.info('END: addUser service');
			return;
		});
	}

	/**
	 * Get all users
	 */
	async getAllUsers(
		programId: string,
		toUseSheetJsonFormat: boolean = true,
		whereOptions: FindOptionsWhere<ProgramUser> = {},
		queryOptions: QueryOptionsInterface = defaultQueryOptions,
	) {
		this.logger.info('START: getAllUsers service');

		const programUsersResult = await this.programUserRepository.find({
			where: {
				programId,
				...whereOptions
			},
			relations: { user: true },
			...queryOptions,
		});

		if (!programUsersResult || programUsersResult.length === 0) {
			throw new NotFoundException(
				`Error. Users of Program ${programId} not found.`,
			);
		}

		if (toUseSheetJsonFormat) {
			// const membersSheetJson = this.userConverter.convertToSheetJson(promoterMembers);

			this.logger.info('END: getAllUsers service: Returning Workbook');
			// return membersSheetJson;
		}

		this.logger.info('END: getAllUsers service');
		return programUsersResult.map((pu) =>
			this.userConverter.convert(pu.user, pu),
		);
	}

	/**
	 * Update role
	 */
	async updateRole(
		programId: string,
		userId: string,
		body: UpdateProgramUserDto,
	) {
		this.logger.info('START: updateRole service');

		const programUserResult = await this.checkIfUserExistsInProgram(
			programId,
			userId,
		);

		if (!programUserResult) {
			this.logger.error(`Error. User ${userId} of Program ${programId} not found.`);
			throw new NotFoundException(`Error. User ${userId} of Program ${programId} not found.`);
		}

		await this.programUserRepository.update(
			{ programId, userId },
			{ role: body.role, updatedAt: () => `NOW()` },
		);
		this.logger.info('END: updateRole service');
	}

	/**
	 * Remove user
	 */
	async removeUser(programId: string, userId: string) {
		this.logger.info('START: removeUser service');

		// will throw error in case program doesn't exist
		await this.getProgramEntity(programId);

		const programUserResult = await this.checkIfUserExistsInProgram(
			programId,
			userId,
		);

		if (!programUserResult) {
			this.logger.error(`Error. User ${userId} not found in Program ${programId}.`);
			throw new NotFoundException(`Error. User ${userId} not found in Program ${programId}.`);
		}

		await this.programUserRepository.update(
			{ programId, userId },
			{
				status: statusEnum.INACTIVE,
				updatedAt: () => `NOW()`,
			},
		);
		this.logger.info('END: removeUser service');
	}

	async getProgramUserRowEntity(programId: string, userId: string) {
		this.logger.info(`START: getProgramUserRowEntity service`);

		// will throw error in case program doesn't exist
		await this.getProgramEntity(programId);

		const programUserResult = await this.programUserRepository.findOne({
			where: {
				programId,
				userId,
				status: statusEnum.ACTIVE
			},
		});

		if (!programUserResult) {
			this.logger.error(`Error. User ${userId} not found in Program ${programId}.`);
			throw new NotFoundException(`Error. User ${userId} not found in Program ${programId}.`);
		}

		this.logger.info(`END: getProgramUserRowEntity service`);
		return programUserResult;
	}

	async checkIfUserExistsInProgram(programId: string, userId: string) {
		const programUserResult = await this.programUserRepository.findOne({
			where: { programId, userId },
		});

		return programUserResult;
	}

	/**
	 * Get all promoters
	 */
	async getAllPromoters(
		programId: string,
		whereOptions: FindOptionsWhere<Promoter> = {},
		queryOptions: QueryOptionsInterface = defaultQueryOptions,
	) {
		this.logger.info(`START: getAllPromoters service`);

		const programPromotersResult =
			await this.programPromoterRepository.find({
				where: {
					programId,
					...whereOptions
				},
				relations: { promoter: true },
				...queryOptions,
			});

		if (!programPromotersResult) {
			throw new NotFoundException(
				`Error. Promoters of Program ${programId} not found.`,
			);
		}

		const programPromotersDto = programPromotersResult.map((programPromoter) =>
			this.promoterConverter.convert(programPromoter.promoter, programPromoter.acceptedTermsAndConditions),
		);

		this.logger.info(`END: getAllPromoters service`);
		return programPromotersDto;
	}

	/**
	 * Get signups in workspace
	 */
	async getSignUpsInProgram(
		userId: string,
		programId: string,
		queryOptions: QueryOptionsInterface = defaultQueryOptions,
	) {
		this.logger.info(`START: getSignUpsInProgram service`);

		// will throw error if user isn't in the program
		if (!(await this.checkIfUserExistsInProgram(programId, userId))) {
			this.logger.error(
				`User does not have permission to perform this action! Not part of this program!`,
			);
			throw new ForbiddenException(`Forbidden Resource`);
		}

		const programResult = await this.programRepository.findOne({
			where: { programId },
			relations: {
				contacts: {
					signup: {
						contact: true,
						promoter: true,
						link: true,
					},
				},
			},
			...queryOptions,
		});

		if (!programResult) {
			throw new NotFoundException(
				`Error. Signups of Program ${programId} not found.`,
			);
		}

		const signUpDtos = programResult.contacts
			.filter((c) => c.signup) // because not all contacts have signups
			.map((contact) => this.signUpConverter.convert(contact.signup));

		this.logger.info(`END: getSignUpsInProgram service`);
		return signUpDtos;
	}

	/**
	 * Get purchases in workspace
	 */
	async getPurchasesInProgram(
		userId: string,
		programId: string,
		whereOptions: FindOptionsWhere<Purchase> = {},
		queryOptions: QueryOptionsInterface = defaultQueryOptions,
	) {
		this.logger.info(`START: getPurchasesInProgram service`);

		if (!(await this.checkIfUserExistsInProgram(programId, userId))) {
			this.logger.error(
				`User does not have permission to perform this action! Not part of this program!`,
			);
			throw new ForbiddenException(`Forbidden Resource`);
		}

		const purchases = await this.purchaseRepository.find({
			relations: {
				promoter: {
					programPromoters: {
						program: true,
					},
				},
				link: true,
				contact: true,
			},
			where: {
				promoter: {
					programPromoters: {
						program: {
							programId,
						},
					},
				},
				...whereOptions,
			},
			...queryOptions,
		});

		if (!purchases) {
			throw new NotFoundException(
				`Error. Purchases of Program ${programId} not found.`,
			);
		}

		const purchaseDtos = purchases.map((purchase) =>
			this.purchaseConverter.convert(purchase),
		);

		this.logger.info(`END: getPurchasesInProgram service`);
		return purchaseDtos;
	}

	/**
	 * Get all commissions
	 */
	async getAllCommissions(
		userId: string,
		programId: string,
		whereOptions: FindOptionsWhere<Commission> = {},
		queryOptions: QueryOptionsInterface = defaultQueryOptions,
	) {
		this.logger.info(`START: getAllCommissions service`);

		// will throw error if user isn't in the program
		if (!(await this.checkIfUserExistsInProgram(programId, userId))) {
			this.logger.error(
				`User does not have permission to perform this action! Not part of this program!`,
			);
			throw new ForbiddenException(`Forbidden Resource`);
		}

		const programResult = await this.programRepository.findOne({
			where: {
				programId,
				...whereOptions,
			},
			relations: {
				contacts: {
					commissions: true,
				},
			},
			...queryOptions,
		});

		if (!programResult) {
			this.logger.warn(`Error. Program ${programId} not found.`);
			throw new NotFoundException(`Error. Program ${programId} not found.`);
		}

		let commissions: Commission[] = [];
		programResult.contacts.forEach((contact) => {
			commissions = [...commissions, ...contact.commissions];
		});

		const commissionsDto = commissions.map((c) =>
			this.commissionConverter.convert(c),
		);

		this.logger.info(`END: getAllCommissions service`);
		return commissionsDto;
	}

	async getAllProgramReferrals(userId: string, programId: string) {
		this.logger.info(`START: getAllProgramReferrals service`);

		// will throw error in case program doesn't exist
		await this.getProgramEntity(programId);

		if (!(await this.checkIfUserExistsInProgram(programId, userId))) {
			throw new UnauthorizedException();
		}

		const referralsResult = await this.referralViewRepository.find({
			where: { programId },
		});

		const referralsDto = referralsResult.map(referral => this.referralConverter.convertTo(referral));
		
		this.logger.info(`END: getAllProgramReferrals service`);
		return referralsDto;
	}

	async getProgramReport(
		programId: string,
		startDate: Date,
		endDate: Date,
	) {
		this.logger.info(`START: getProgramReport service`);

		const query = this.programRepository
			.createQueryBuilder("program")
			.leftJoinAndSelect("program.programPromoters", "programPromoters")
			.leftJoinAndSelect("programPromoters.promoter", "promoter")
			.leftJoinAndSelect(
				"promoter.signUps",
				"signUps",
				"signUps.createdAt >= :start AND signUps.createdAt <= :end"
			)
			.leftJoinAndSelect(
				"promoter.purchases",
				"purchases",
				"purchases.createdAt >= :start AND purchases.createdAt <= :end"
			)
			.leftJoinAndSelect(
				"promoter.commissions",
				"commissions",
				"commissions.createdAt >= :start AND commissions.createdAt <= :end"
			)
			.where("program.programId = :programId AND promoter.createdAt <= :end", { programId })
			.setParameters({ start: startDate.toISOString(), end: endDate.toISOString() });

		const programResult = await query.getOne();

		if (!programResult) {
			this.logger.warn(`Warning. No data found for Program ${programId} for period: ${startDate} - ${endDate}`);
		}

		const programSheetJsonWorkbook = this.programConverter.convertToReportWorkbook(programId, programResult, startDate, endDate);

		const workbook = ProgramWorkbook.toXlsx();

		// get list and table
		const programSummaryList = programSheetJsonWorkbook.getProgramSummarySheet().getProgramSummaryList();
		const promotersTable = programSheetJsonWorkbook.getPromoterSheet().getPromoterTable();

		// all sheets
		const promotersSheetData: any[] = [snakeCaseToHumanReadable(promotersTable.getHeader())];

		const programSummarySheetData: any[] = [];

		// pushing promoters data
		promotersTable.getRows().map((row) => {
			promotersSheetData.push(row);
		});

		// pushing program summary data
		programSummaryList.getItems().forEach((item) => {
			programSummarySheetData.push([snakeCaseToHumanReadable(item.getKey()), item.getValue()]);
		});

		// entering data to sheet
		const summarySheet = XLSX.utils.aoa_to_sheet(programSummarySheetData);
		const promotersSheet = XLSX.utils.aoa_to_sheet(promotersSheetData);

		// adding sheets to workbook
		XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
		XLSX.utils.book_append_sheet(workbook, promotersSheet, 'Promoters');

		const fileBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

		this.logger.info(`END: getProgramReport service`);
		return fileBuffer;
	}
}
