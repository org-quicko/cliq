import {
	ConflictException,
	ForbiddenException,
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { DataSource, FindOptionsRelations, Repository, FindOptionsWhere, In, ILike } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Circle, Commission, Program, Promoter, Purchase, ReferralView, SignUp, User } from '../entities';
import { PromoterAnalyticsDayWiseView } from '../entities/promoterAnalyticsDayWiseView.entity';
import { CreateUserDto } from '../dtos';
import { ProgramUser } from '../entities/programUser.entity';
import {
	CreateProgramDto,
	UpdateProgramDto,
	UpdateProgramUserDto,
} from '../dtos';
import { UserService } from './user.service';
import { ProgramPromoter } from '../entities/programPromoter.entity';
import { ProgramConverter } from '../converters/program/program.dto.converter';
import { PromoterConverter } from '../converters/promoter/promoter.dto.converter';
import { UserConverter } from '../converters/user.converter';
import { QueryOptionsInterface } from '../interfaces/queryOptions.interface';
import { PurchaseConverter } from '../converters/purchase/purchase.dto.converter';
import { CommissionConverter } from '../converters/commission/commission.dto.converter';
import { userRoleEnum, statusEnum, visibilityEnum } from '../enums';
import { LoggerService } from './logger.service';
import * as bcrypt from 'bcrypt';
import { SALT_ROUNDS } from 'src/constants';
import { defaultQueryOptions } from 'src/constants';
import { formatDate } from 'src/utils';
import { subjectsType } from 'src/types';
import { SignUpConverter } from 'src/converters/signup/signUp.dto.converter';
import { ReferralConverter } from 'src/converters/referral.converter';
import { stringify } from 'csv-stringify';
import { PassThrough, Transform } from 'node:stream';
import { BadRequestException } from '@org-quicko/core';
import { ProgramAnalyticsConverter } from '../converters/program/program_analytics.workbook.converter';
import { PromoterAnalyticsConverter } from '../converters/promoter/promoter_analytics.workbook.converter';
import { ProgramSummaryViewWorkbookConverter } from '../converters/program/program_summary_view.workbook.converter';
import { ProgramSummaryView } from '../entities/programSummaryView.entity';

@Injectable()
export class ProgramService {
	constructor(
		@InjectRepository(Program)
		private readonly programRepository: Repository<Program>,

		@InjectRepository(ProgramUser)
		private readonly programUserRepository: Repository<ProgramUser>,

		@InjectRepository(ProgramPromoter)
		private readonly programPromoterRepository: Repository<ProgramPromoter>,

		@InjectRepository(SignUp)
		private readonly signUpRepository: Repository<SignUp>,

		@InjectRepository(Purchase)
		private readonly purchaseRepository: Repository<Purchase>,

		@InjectRepository(Commission)
		private readonly commissionRepository: Repository<Commission>,

		@InjectRepository(ReferralView)
		private readonly referralViewRepository: Repository<ReferralView>,

		@InjectRepository(PromoterAnalyticsDayWiseView)
		private readonly promoterAnalyticsDayWiseViewRepository: Repository<PromoterAnalyticsDayWiseView>,

		@InjectRepository(ProgramSummaryView)
		private readonly programSummaryViewRepository: Repository<ProgramSummaryView>,

		private userService: UserService,

		private programConverter: ProgramConverter,
		private programAnalyticsConverter: ProgramAnalyticsConverter,
		private promoterConverter: PromoterConverter,
		private userConverter: UserConverter,
		private signUpConverter: SignUpConverter,
		private purchaseConverter: PurchaseConverter,
		private commissionConverter: CommissionConverter,
		private referralConverter: ReferralConverter,
		private promoterAnalyticsConverter: PromoterAnalyticsConverter,
		private programSummaryViewConverter: ProgramSummaryViewWorkbookConverter,

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
	async getAllPrograms(userId: string, whereOptions: FindOptionsWhere<Program> = {}, queryOptions: QueryOptionsInterface = defaultQueryOptions) {
		this.logger.info('START: getAllPrograms service');

		const programResult = await this.programRepository.find({
			where: {
				programUsers: {
					userId,
					status: statusEnum.ACTIVE
				},
				...whereOptions,
			},
			relations: {
				programUsers: true
			},
			...queryOptions
		});

		
		// Map programs and include the user's role from ProgramUser
		const programsDto = programResult.map(program => {
			const programDto = this.programConverter.convert(program);
			// Find the ProgramUser entry for the current user
			const userProgramUser = program.programUsers?.find(pu => pu.userId === userId);
			return {
				...programDto,
				role: userProgramUser?.role || null
			};
		});

		this.logger.info('END: getAllPrograms service');
		return programsDto;
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

		const program = await this.programRepository.findOne({ where: { programId } });

		if (!program) {
			this.logger.error(`Error. Program ${programId} not found.`);
			throw new NotFoundException(`Error. Program ${programId} not found.`);
		}

		const isPublic = program.visibility === visibilityEnum.PUBLIC;

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
				const programUserResult = await this.programUserRepository.findOne({
					where: {
						programId,
						userId: user.userId
					}
				});

				if (programUserResult) {
					// if it does, is status active?
					// if both yes, throw error -> cannot invite user, since they're already part of the program
					if (programUserResult.status === statusEnum.ACTIVE) {
						const message = 'Failed to add user. User is already part of the program.';
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

		const programUserResult = await this.programUserRepository.findOne({
			where: {
				programId,
				userId
			}
		});

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

		const programUserResult = await this.programUserRepository.findOne({
			where: {
				programId,
				userId
			}
		});

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

	async checkIfUserExistsInProgram(userId: string, programId: string, subject: subjectsType) {
		this.logger.info('START: checkIfUserExistsInProgram service');
		
		const programUserResult = await this.programUserRepository.findOne({
			where: {
				programId,
				userId
			},
		});

		this.logger.info('END: checkIfUserExistsInProgram service');
		return programUserResult === null ? programUserResult : subject;
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
		if (!(await this.programUserRepository.findOne({ where: { programId, userId } }))) {
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

		if (!(await this.programUserRepository.findOne({ where: { programId, userId } }))) {
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
		if (!(await this.programUserRepository.findOne({ where: { programId, userId } }))) {
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

		if (!(await this.programUserRepository.findOne({ where: { programId, userId } }))) {
			throw new UnauthorizedException();
		}

		const referralsResult = await this.referralViewRepository.find({
			where: { programId },
		});

		const referralsDto = referralsResult.map(referral => this.referralConverter.convertTo(referral));

		this.logger.info(`END: getAllProgramReferrals service`);
		return referralsDto;
	}

	async getCommissionsReport(
		programId: string,
		startDate: Date,
		endDate: Date,
		cancellationToken?: { isCancelled: boolean }
	) {
		this.logger.info(`START: getCommissionsReport service`);

		// Create a streaming CSV generator that doesn't accumulate data in memory
		const promotersCSV = this.streamPromoters(programId, startDate, endDate, cancellationToken);

		promotersCSV.on('error', (err) => {
			this.logger.error('Promoters CSV stream error:', err);
		});

		promotersCSV.on('end', () => {
			this.logger.info('Promoters CSV stream ended');
		});

		promotersCSV.on('close', () => {
			this.logger.info('Promoters CSV stream closed');
		});

		this.logger.info(`END: getCommissionsReport service`);
		return promotersCSV;
	}

	/**
	 * Creates a readable stream that generates CSV data for promoters in a program
	 */
	private streamPromoters(
		programId: string,
		startDate: Date,
		endDate: Date,
		cancellationToken?: { isCancelled: boolean }
	): NodeJS.ReadableStream {
		const sql = `
			SELECT 
				pa.promoter_id,
				p.name,
				SUM(pa.revenue) AS total_revenue,
				SUM(pa.commission) AS total_commission,
				SUM(pa.signups) AS total_signups,
				SUM(pa.purchases) AS total_purchases
			FROM promoter_analytics_day_wise_mv pa
			INNER JOIN promoter p ON p.promoter_id = pa.promoter_id
			WHERE pa.program_id = $1
			AND pa.date >= $2
			AND pa.date <= $3
			GROUP BY pa.promoter_id, p.name;
		`;

		const params = [programId, startDate.toISOString(), endDate.toISOString()];

		const queryRunner = this.datasource.createQueryRunner();
		const columns = [
			'promoter_id',
			'promoter_name',
			'total_revenue',
			'total_commission',
			'total_signups',
			'total_purchases'
		];

		const rowToCsv = new Transform({
			objectMode: true,
			highWaterMark: 16,
			transform(row: any, _enc, cb) {
				// Check for cancellation
				if (cancellationToken?.isCancelled) {
					return cb(new Error('Stream cancelled'));
				}

				cb(null, {
					promoter_id: row.promoter_id,
					promoter_name: row.name,
					total_revenue: row.total_revenue,
					total_commission: row.total_commission,
					total_signups: row.total_signups,
					total_purchases: row.total_purchases,
				});
			}
		});

		const csv = stringify({ 
			header: true, 
			columns,
		});

		const stream = new PassThrough();

		// Track if cleanup is needed
		let isCleanedUp = false;
		const cleanup = async () => {
			if (!isCleanedUp) {
				isCleanedUp = true;
				try {
					await queryRunner.release();
				} catch (err) {
					this.logger.warn('Error releasing query runner:', err);
				}
			}
		};

		(async () => {
			try {
				await queryRunner.connect();
				const rowStream = await queryRunner.stream(sql, params);

				// Handle row stream errors
				rowStream.on('error', (err) => {
					this.logger.error('Row stream error:', err);
					stream.destroy(err);
					cleanup();
				});

		
				rowStream.on('end', () => {
					this.logger.info('Row stream ended');
				});

		
				rowStream.on('close', () => {
					this.logger.info('Row stream closed');
				});

				rowStream
					.pipe(rowToCsv)
					.on('error', (err) => {
						this.logger.error('Transform error:', err);
						stream.destroy(err);
						cleanup();
					})
					.pipe(csv)
					.on('error', (err) => {
						this.logger.error('CSV stringify error:', err);
						stream.destroy(err);
						cleanup();
					})
					.pipe(stream)
					.on('finish', cleanup)
					.on('error', cleanup);

			} catch (err) {
				this.logger.error('Stream setup error:', err);
				stream.destroy(err as any);
				await cleanup();
			}
		})();


		stream.on('close', cleanup);
		stream.on('error', cleanup);

		return stream;
	}


	async getProgramAnalytics(
        programId: string,
        period: string = '30days',
        customStartDate?: Date,
        customEndDate?: Date,
    ) {
        this.logger.info('START: getProgramAnalytics service');

        const { startDate, endDate } = this.getDateRange(period, customStartDate, customEndDate);
        const dataType = this.getDataType(period, startDate, endDate);

        // Get aggregate totals
        const aggregateResult = await this.promoterAnalyticsDayWiseViewRepository
            .createQueryBuilder('analytics')
            .select('COALESCE(SUM(analytics.dailyRevenue), 0)', 'totalRevenue')
            .addSelect('COALESCE(SUM(analytics.dailyCommission), 0)', 'totalCommissions')
            .addSelect('COALESCE(SUM(analytics.dailySignups), 0)', 'totalSignups')
            .addSelect('COALESCE(SUM(analytics.dailyPurchases), 0)', 'totalPurchases')
            .where('analytics.programId = :programId', { programId })
            .andWhere('analytics.date >= :startDate', { startDate })
            .andWhere('analytics.date <= :endDate', { endDate })
            .getRawOne();

        // Get breakdown data for chart
        let dailyData: Array<{ date: string; signups: number; purchases: number; revenue: number; commission: number }>;

        if (dataType === 'yearly' || (period === 'custom' && customStartDate && customEndDate && this.getMonthDifference(customStartDate, customEndDate) > 35)) {
            const yearlyData = await this.promoterAnalyticsDayWiseViewRepository
                .createQueryBuilder('analytics')
                .select('EXTRACT(YEAR FROM analytics.date)', 'year')
                .addSelect('COALESCE(SUM(analytics.dailySignups), 0)', 'signups')
                .addSelect('COALESCE(SUM(analytics.dailyPurchases), 0)', 'purchases')
                .addSelect('COALESCE(SUM(analytics.dailyRevenue), 0)', 'revenue')
                .addSelect('COALESCE(SUM(analytics.dailyCommission), 0)', 'commission')
                .where('analytics.programId = :programId', { programId })
                .andWhere('analytics.date >= :startDate', { startDate })
                .andWhere('analytics.date <= :endDate', { endDate })
                .groupBy('EXTRACT(YEAR FROM analytics.date)')
                .orderBy('year', 'ASC')
                .getRawMany();

            dailyData = yearlyData.map(row => ({
                date: `${row.year}-01-01`,
                signups: Number(row.signups) || 0,
                purchases: Number(row.purchases) || 0,
                revenue: Number(row.revenue) || 0,
                commission: Number(row.commission) || 0,
            }));

        } else if (dataType === 'monthly' || (period === 'custom' && customStartDate && customEndDate && this.getDayDifference(customStartDate, customEndDate) > 90)) {
            const monthlyData = await this.promoterAnalyticsDayWiseViewRepository
                .createQueryBuilder('analytics')
                .select("TO_CHAR(analytics.date, 'YYYY-MM')", 'month')
                .addSelect('COALESCE(SUM(analytics.dailySignups), 0)', 'signups')
                .addSelect('COALESCE(SUM(analytics.dailyPurchases), 0)', 'purchases')
                .addSelect('COALESCE(SUM(analytics.dailyRevenue), 0)', 'revenue')
                .addSelect('COALESCE(SUM(analytics.dailyCommission), 0)', 'commission')
                .where('analytics.programId = :programId', { programId })
                .andWhere('analytics.date >= :startDate', { startDate })
                .andWhere('analytics.date <= :endDate', { endDate })
                .groupBy("TO_CHAR(analytics.date, 'YYYY-MM')")
                .orderBy('month', 'ASC')
                .getRawMany();

            dailyData = monthlyData.map(row => ({
                date: `${row.month}-01`,
                signups: Number(row.signups) || 0,
                purchases: Number(row.purchases) || 0,
                revenue: Number(row.revenue) || 0,
                commission: Number(row.commission) || 0,
            }));

        } else if (period === '3months' || dataType === 'weekly') {
            const dayDiff = period === '3months' ? 90 : this.getDayDifference(customStartDate!, customEndDate!);
            const weeksToShow = period === '3months' ? 13 : Math.ceil(dayDiff / 7);

            const weeklyData = await this.promoterAnalyticsDayWiseViewRepository
                .createQueryBuilder('analytics')
                .select("TO_CHAR(DATE_TRUNC('week', analytics.date), 'YYYY-MM-DD')", 'weekStart')
                .addSelect('COALESCE(SUM(analytics.dailySignups), 0)', 'signups')
                .addSelect('COALESCE(SUM(analytics.dailyPurchases), 0)', 'purchases')
                .addSelect('COALESCE(SUM(analytics.dailyRevenue), 0)', 'revenue')
                .addSelect('COALESCE(SUM(analytics.dailyCommission), 0)', 'commission')
                .where('analytics.programId = :programId', { programId })
                .andWhere('analytics.date >= :startDate', { startDate })
                .andWhere('analytics.date <= :endDate', { endDate })
                .groupBy("DATE_TRUNC('week', analytics.date)")
                .orderBy('"weekStart"', 'ASC')
                .limit(weeksToShow)
                .getRawMany();

            dailyData = weeklyData.map(row => ({
                date: row.weekStart,
                signups: Number(row.signups) || 0,
                purchases: Number(row.purchases) || 0,
                revenue: Number(row.revenue) || 0,
                commission: Number(row.commission) || 0,
            }));

        } else {
            const rawDailyData = await this.promoterAnalyticsDayWiseViewRepository
                .createQueryBuilder('analytics')
                .select("TO_CHAR(analytics.date, 'YYYY-MM-DD')", 'date')
                .addSelect('COALESCE(SUM(analytics.dailySignups), 0)', 'signups')
                .addSelect('COALESCE(SUM(analytics.dailyPurchases), 0)', 'purchases')
                .addSelect('COALESCE(SUM(analytics.dailyRevenue), 0)', 'revenue')
                .addSelect('COALESCE(SUM(analytics.dailyCommission), 0)', 'commission')
                .where('analytics.programId = :programId', { programId })
                .andWhere('analytics.date >= :startDate', { startDate })
                .andWhere('analytics.date <= :endDate', { endDate })
                .groupBy('analytics.date')
                .orderBy('analytics.date', 'ASC')
                .getRawMany();

            dailyData = rawDailyData.map(row => ({
                date: row.date,
                signups: Number(row.signups) || 0,
                purchases: Number(row.purchases) || 0,
                revenue: Number(row.revenue) || 0,
                commission: Number(row.commission) || 0,
            }));

            if (period === '7days') {
                dailyData = dailyData.slice(-7);
            }
        }

        this.logger.info('END: getProgramAnalytics service');

        const workbook = this.programAnalyticsConverter.convert(
            Number(aggregateResult?.totalRevenue) || 0,
            Number(aggregateResult?.totalCommissions) || 0,
            Number(aggregateResult?.totalSignups) || 0,
            Number(aggregateResult?.totalPurchases) || 0,
            period,
        );

        return {
            ...workbook,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            dailyData,
            dataType,
        };
    }


	

    async getPromoterAnalytics(
        programId: string,
        sortBy: 'signup_commission' | 'signups' | 'purchase_commission' | 'revenue' = 'signup_commission',
        period: string = '30days',
        customStartDate?: Date,
        customEndDate?: Date,
        skip: number = 0,
        take: number = 5,
    ) {
		this.logger.info('START: getPromoterAnalytics service');

		const { startDate, endDate } = this.getDateRange(period, customStartDate, customEndDate);

		const orderColumnMap: Record<string, string> = {
			'signup_commission': 'signupCommission',
			'signups': 'totalSignups',
			'purchase_commission': 'purchaseCommission',
			'revenue': 'totalRevenue',
		};
		const orderColumn = orderColumnMap[sortBy] || 'signupCommission';

		const promoterData = await this.promoterAnalyticsDayWiseViewRepository
			.createQueryBuilder('analytics')
			.leftJoin(Promoter, 'promoter', 'promoter.promoterId = analytics.promoterId')
			.select('analytics.promoterId', 'promoterId')
			.addSelect('promoter.name', 'promoterName')
			.addSelect('COALESCE(SUM(analytics.dailySignups), 0)', 'totalSignups')
			.addSelect('COALESCE(SUM(analytics.dailyPurchases), 0)', 'totalPurchases')
			.addSelect('COALESCE(SUM(analytics.dailyRevenue), 0)', 'totalRevenue')
			.addSelect('COALESCE(SUM(analytics.dailyCommission), 0)', 'totalCommission')
			.addSelect('COALESCE(SUM(analytics.signupCommission), 0)', 'signupCommission')
			.addSelect('COALESCE(SUM(analytics.purchaseCommission), 0)', 'purchaseCommission')
			.where('analytics.programId = :programId', { programId })
			.andWhere('analytics.date >= :startDate', { startDate })
			.andWhere('analytics.date <= :endDate', { endDate })
			.groupBy('analytics.promoterId, promoter.promoterId')
			.orderBy(`"${orderColumn}"`, 'DESC')
			.offset(skip)
			.limit(take)
			.getRawMany();

		const totalCountResult = await this.promoterAnalyticsDayWiseViewRepository
			.createQueryBuilder('analytics')
			.select('COUNT(DISTINCT analytics.promoterId)', 'count')
			.where('analytics.programId = :programId', { programId })
			.andWhere('analytics.date >= :startDate', { startDate })
			.andWhere('analytics.date <= :endDate', { endDate })
			.getRawOne();

		const totalCount = Number(totalCountResult?.count) || 0;

		const result = promoterData.map(p => ({
			promoterId: p.promoterId,
			promoterName: p.promoterName || 'Unknown',
			signups: Number(p.totalSignups) || 0,
			purchases: Number(p.totalPurchases) || 0,
			revenue: Number(p.totalRevenue) || 0,
			commission: Number(p.totalCommission) || 0,
			signupCommission: Number(p.signupCommission) || 0,
			purchaseCommission: Number(p.purchaseCommission) || 0,
		}));

		this.logger.info('END: getPromoterAnalytics service');

		return this.promoterAnalyticsConverter.convert({
			programId,
			promoters: result,
			pagination: {
				total: totalCount,
				skip,
				take,
				hasMore: skip + take < totalCount,
			},
			sortBy,
			period,
		});
    }




	/**
	 * Helper method to get date range based on period
	 */
	private getDateRange(period: string, customStartDate?: Date, customEndDate?: Date): { startDate: Date; endDate: Date } {
		let startDate: Date;
		let endDate = new Date();

		switch (period) {
			case '7days':
				startDate = new Date();
				startDate.setDate(startDate.getDate() - 7);
				break;
			case '30days':
				startDate = new Date();
				startDate.setDate(startDate.getDate() - 30);
				break;
			case '3months':
				startDate = new Date();
				startDate.setMonth(startDate.getMonth() - 3);
				break;
			case '6months':
				startDate = new Date();
				startDate.setMonth(startDate.getMonth() - 6);
				break;
			case '1year':
				startDate = new Date();
				startDate.setFullYear(startDate.getFullYear() - 1);
				break;
			case 'custom':
				if (!customStartDate || !customEndDate) {
					throw new BadRequestException(
						'startDate and endDate are required for custom period',
					);
				}
				startDate = customStartDate;
				endDate = customEndDate;
				break;
			case 'all':
				startDate = new Date('1970-01-01');
				break;
			default:
				startDate = new Date();
				startDate.setDate(startDate.getDate() - 30);
		}

		return { startDate, endDate };
	}

	private getDataType(period: string, startDate?: Date, endDate?: Date): string {
		if (period === '7days' || period === '30days' || period === '3months') {
			return 'daily';
		} else if (period === '6months' || period === '1year') {
			return 'monthly';
		} else if (period === 'all') {
			return 'yearly';
		} else if (period === 'custom' && startDate && endDate) {
			const dayDiff = this.getDayDifference(startDate, endDate);
			const monthDiff = this.getMonthDifference(startDate, endDate);
			
			if (dayDiff <= 7) {
				return 'daily-7';
			} else if (dayDiff <= 35) {
				return 'daily-30';
			} else if (dayDiff <= 90) {
				return 'weekly';
			} else if (monthDiff <= 35) {
				return 'monthly';
			} else if(monthDiff > 35) {
				return 'yearly';
			}
		}
		return 'daily';
	}

	private getDayDifference(startDate: Date, endDate: Date): number {
		const start = new Date(startDate);
		const end = new Date(endDate);
		const diffTime = Math.abs(end.getTime() - start.getTime());
		return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	}

	private getMonthDifference(startDate: Date, endDate: Date): number {
		const start = new Date(startDate);
		const end = new Date(endDate);
		return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
	}

	/**
	 * Get program summary list for super admin
	 */
	async getProgramSummary(
		userId: string,
		programId?: string,
		name?: string,
		skip: number = 0,
		take: number = 10,
	) {
		this.logger.info('START: getProgramSummary service');

		const whereClause: FindOptionsWhere<ProgramSummaryView> = {
			...(programId && { programId }),
			...(name && { programName: ILike(`%${name}%`) }),
		};

		const [programSummaries, totalCount] = await this.programSummaryViewRepository.findAndCount({
			where: whereClause,
			order: {
				createdAt: 'DESC',
			},
			skip,
			take,
		});

		const result = this.programSummaryViewConverter.convert(
			programSummaries.map(ps => ({
				programId: ps.programId,
				programName: ps.programName,
				totalPromoters: Number(ps.totalPromoters),
				totalReferrals: Number(ps.totalReferrals),
				createdAt: ps.createdAt,
			})),
			{
				skip,
				take,
			},
		);

		this.logger.info('END: getProgramSummary service');
		return result;
	}
}
