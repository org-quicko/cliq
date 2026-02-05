import {
	ConflictException,
	ForbiddenException,
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { DataSource, FindOptionsRelations, Repository, FindOptionsWhere, In, Between, ILike } from 'typeorm';
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
import { ProgramSummaryViewConverter } from '../converters/program/program_summary_view.workbook.converter';
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
		private programSummaryViewConverter: ProgramSummaryViewConverter,

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
		this.logger.info(`Fetching programs for userId: ${userId}`);

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
		
		this.logger.info(`Found ${programResult.length} programs for user ${userId}`);
		
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
	async addUser(programId: string, body: CreateUserDto, requestingUserId?: string) {
		return this.datasource.transaction(async (manager) => {
			this.logger.info('START: addUser service');
			const programResult = await this.getProgramEntity(programId);

			// Validate that only SUPER_ADMINs can assign SUPER_ADMIN role
			if (body.role === userRoleEnum.SUPER_ADMIN) {
				if (requestingUserId) {
					const requestingUser = await this.userService.getUserEntity(requestingUserId);
					if (requestingUser.role !== userRoleEnum.SUPER_ADMIN) {
						this.logger.error('Only SUPER_ADMIN can assign SUPER_ADMIN role');
						throw new ForbiddenException('Only SUPER_ADMIN can assign SUPER_ADMIN role');
					}
				} else {
					this.logger.error('Cannot assign SUPER_ADMIN role without requesting user context');
					throw new ForbiddenException('Only SUPER_ADMIN can assign SUPER_ADMIN role');
				}
			}

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
		requestingUserId?: string,
	) {
		this.logger.info('START: updateRole service');

		// Validate that only SUPER_ADMINs can assign SUPER_ADMIN role
		if (body.role === userRoleEnum.SUPER_ADMIN) {
			if (requestingUserId) {
				const requestingUser = await this.userService.getUserEntity(requestingUserId);
				if (requestingUser.role !== userRoleEnum.SUPER_ADMIN) {
					this.logger.error('Only SUPER_ADMIN can assign SUPER_ADMIN role');
					throw new ForbiddenException('Only SUPER_ADMIN can assign SUPER_ADMIN role');
				}
			} else {
				this.logger.error('Cannot assign SUPER_ADMIN role without requesting user context');
				throw new ForbiddenException('Only SUPER_ADMIN can assign SUPER_ADMIN role');
			}
		}

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
		
		// Get user to check if they're SUPER_ADMIN
		const user = await this.userService.getUserEntity(userId);
		
		// SUPER_ADMIN can access all programs without being explicitly added
		if (user && user.role === userRoleEnum.SUPER_ADMIN) {
			this.logger.info('User is SUPER_ADMIN, granting access without program membership check');
			this.logger.info('END: checkIfUserExistsInProgram service');
			return subject;
		}
		
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

	async getProgramReport(
		programId: string,
		startDate: Date,
		endDate: Date,
		cancellationToken?: { isCancelled: boolean }
	) {
		this.logger.info(`START: getProgramReport service`);

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

		this.logger.info(`END: getProgramReport service`);
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

				// Handle row stream end
				rowStream.on('end', () => {
					this.logger.info('Row stream ended');
				});

				// Handle row stream close
				rowStream.on('close', () => {
					this.logger.info('Row stream closed');
				});

				// Pipe the streams with proper error handling
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

		// Handle stream cleanup on destroy
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

        const dayWiseAnalytics = await this.datasource
            .getRepository(PromoterAnalyticsDayWiseView)
            .find({
                where: {
                    programId,
                    date: Between(startDate, endDate),
                },
            });

        if (!dayWiseAnalytics || dayWiseAnalytics.length === 0) {
            this.logger.info('END: getProgramAnalytics service - no data found');
            return this.programAnalyticsConverter.convert({
                totalRevenue: 0,
                totalCommissions: 0,
                totalSignups: 0,
                totalPurchases: 0,
                period,
            });
        }
        const totalRevenue = dayWiseAnalytics.reduce(
            (sum, analytics) => sum + (analytics.dailyRevenue || 0),
            0,
        );

        const totalCommissions = dayWiseAnalytics.reduce(
            (sum, analytics) => sum + (analytics.dailyCommission || 0),
            0,
        );

        const totalSignups = dayWiseAnalytics.reduce(
            (sum, analytics) => sum + (analytics.dailySignups || 0),
            0,
        );

        const totalPurchases = dayWiseAnalytics.reduce(
            (sum, analytics) => sum + (analytics.dailyPurchases || 0),
            0,
        );

		/* ===================== TEST DATA - Commented out for future testing =====================
		const totalRevenue = 125000;
		const totalCommissions = 25000;
		const totalSignups = 450;
		const totalPurchases = 200;
		===================== END TEST DATA ===================== */


        this.logger.info('END: getProgramAnalytics service');

        return this.programAnalyticsConverter.convert({
            totalRevenue,
            totalCommissions,
            totalSignups,
            totalPurchases,
            period,
        });
    }


	

    async getPromoterAnalytics(
        programId: string,
        sortBy: 'signups' | 'purchases' = 'signups',
        period: string = '30days',
        customStartDate?: Date,
        customEndDate?: Date,
        skip: number = 0,
        take: number = 5,
    ) {

		
		this.logger.info('START: getPromoterAnalytics service');

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

		const dayWiseAnalytics = await this.datasource
			.getRepository(PromoterAnalyticsDayWiseView)
			.find({
				where: {
					programId,
					date: Between(startDate, endDate),
				},
			});

		const promoterMap = new Map<string, {
			promoterId: string;
			signups: number;
			purchases: number;
			revenue: number;
			commission: number;
		}>();

		for (const analytics of dayWiseAnalytics) {
			const existing = promoterMap.get(String(analytics.promoterId)) || {
                promoterId: String(analytics.promoterId),
				signups: 0,
				purchases: 0,
				revenue: 0,
				commission: 0,
			};

			existing.signups += Number(analytics.dailySignups || 0);
existing.purchases += Number(analytics.dailyPurchases || 0);
existing.revenue += Number(analytics.dailyRevenue || 0);
existing.commission += Number(analytics.dailyCommission || 0);


			promoterMap.set(String(analytics.promoterId), existing);
		}

		let promotersData = Array.from(promoterMap.values());

		if (sortBy === 'signups') {
			promotersData.sort((a, b) => b.signups - a.signups);
		} else {
			promotersData.sort((a, b) => b.purchases - a.purchases);
		}

		const totalCount = promotersData.length;
		const paginatedData = promotersData.slice(skip, skip + take);

		const promoterIds = paginatedData.map(p => p.promoterId);
		const promoters = await this.datasource
			.getRepository(Promoter)
			.find({
				where: {
					promoterId: In(promoterIds),
				},
				select: ['promoterId', 'name'],
			});

		const promoterNameMap = new Map(
			promoters.map(p => [p.promoterId, p.name])
		);

		const result = paginatedData.map(p => ({
			promoterId: p.promoterId,
			promoterName: promoterNameMap.get(p.promoterId) || 'Unknown',
			signups: p.signups,
			purchases: p.purchases,
			revenue: p.revenue,
			commission: p.commission,
		}));

		// ===================== TEST DATA - Commented out for future testing =====================
		// const resultTest = [
		// 	{
		// 		promoterId: '44444444-4444-4444-4444-444444444444',
		// 		promoterName: 'Sneha Kapoor',
		// 		signups: 60,
		// 		purchases: 25,
		// 		revenue: 14000,
		// 		commission: 2800,
		// 	},
		// 	{
		// 		promoterId: '55555555-5555-5555-5555-555555555555',
		// 		promoterName: 'Vikram Singh',
		// 		signups: 45,
		// 		purchases: 18,
		// 		revenue: 10000,
		// 		commission: 2000,
		// 	},
		// 	{
		// 		promoterId: '11111111-1111-1111-1111-111111111111',
		// 		promoterName: 'Aarav Sharma',
		// 		signups: 120,
		// 		purchases: 45,
		// 		revenue: 25000,
		// 		commission: 5000,
		// 	},
		// 	{
		// 		promoterId: '22222222-2222-2222-2222-222222222222',
		// 		promoterName: 'Priya Patel',
		// 		signups: 95,
		// 		purchases: 38,
		// 		revenue: 21000,
		// 		commission: 4200,
		// 	},
		// 	{
		// 		promoterId: '33333333-3333-3333-3333-333333333333',
		// 		promoterName: 'Rohan Mehta',
		// 		signups: 80,
		// 		purchases: 30,
		// 		revenue: 18000,
		// 		commission: 3600,
		// 	},
		// 	{
		// 		promoterId: '44444444-4444-4444-4444-444444444444',
		// 		promoterName: 'Sneha Kapoor',
		// 		signups: 60,
		// 		purchases: 25,
		// 		revenue: 14000,
		// 		commission: 2800,
		// 	},
		// 	{
		// 		promoterId: '33333333-3333-3333-3333-333333333333',
		// 		promoterName: 'Rohan Mehta',
		// 		signups: 80,
		// 		purchases: 30,
		// 		revenue: 18000,
		// 		commission: 3600,
		// 	},
		// 	{
		// 		promoterId: '44444444-4444-4444-4444-444444444444',
		// 		promoterName: 'Sneha Kapoor',
		// 		signups: 60,
		// 		purchases: 25,
		// 		revenue: 14000,
		// 		commission: 2800,
		// 	},
			
		// ];
		// To use test data, replace 'result' with 'resultTest' in the return statement
		// ===================== END TEST DATA ===================== 


		this.logger.info('END: getPromoterAnalytics service');

		const testTotalCount = result.length;
		return this.promoterAnalyticsConverter.convert({
			programId,
			promoters: result.slice(skip, skip + take),
			pagination: {
				total: testTotalCount,
				skip,
				take,
				hasMore: skip + take < testTotalCount,
			},
			sortBy,
			period,
		});
    }


    async getDayWiseProgramAnalytics(
        programId: string,
        period: string = '30days',
        customStartDate?: Date,
        customEndDate?: Date,
    ) {
        this.logger.info('START: getDayWiseProgramAnalytics service');

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

		const today = new Date();
		
		const dayWiseData = await this.promoterAnalyticsDayWiseViewRepository
			.createQueryBuilder('analytics')
			.select('analytics.date', 'date')
			.addSelect('SUM(analytics.dailySignups)', 'signups')
			.addSelect('SUM(analytics.dailyPurchases)', 'purchases')
			.addSelect('SUM(analytics.dailyRevenue)', 'revenue')
			.addSelect('SUM(analytics.dailyCommission)', 'commission')
			.where('analytics.programId = :programId', { programId })
			.andWhere('analytics.date >= :startDate', { startDate })
			.andWhere('analytics.date <= :endDate', { endDate })
			.groupBy('analytics.date')
			.orderBy('analytics.date', 'ASC')
			.getRawMany();

		const allDailyData: Array<{ date: string; signups: number; purchases: number; revenue: number; commission: number }> = 
			dayWiseData.map(row => ({
				date: row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date,
				signups: Number(row.signups) || 0,
				purchases: Number(row.purchases) || 0,
				revenue: Number(row.revenue) || 0,
				commission: Number(row.commission) || 0,
			}));

		let analyticsData: Array<{ date: string; signups: number; purchases: number; revenue: number; commission: number }>;

		if (period === '7days') {
			analyticsData = allDailyData.slice(-7);
		} else if (period === '30days') {
			analyticsData = allDailyData;
		} else if (period === '3months') {
			analyticsData = [];
			const dataMap = new Map(allDailyData.map(d => [d.date, d]));
			
			const currentDate = new Date(today);
			for (let i = 0; i < 13; i++) {
				const dateStr = currentDate.toISOString().split('T')[0];
				const dataPoint = dataMap.get(dateStr);
				if (dataPoint) {
					analyticsData.unshift(dataPoint);
				} else {
					analyticsData.unshift({
						date: dateStr,
						signups: 0,
						purchases: 0,
						revenue: 0,
						commission: 0,
					});
				}
				currentDate.setDate(currentDate.getDate() - 7);
			}
		} else if (period === '6months') {
			analyticsData = this.aggregateDataByMonth(allDailyData, 6);
		} else if (period === '1year') {
			analyticsData = this.aggregateDataByMonth(allDailyData, 12);
		} else if (period === 'all') {
			analyticsData = this.aggregateDataByYear(allDailyData);
		} else if (period === 'custom' && customStartDate && customEndDate) {
			// Handle custom period based on date range
			const dayDiff = this.getDayDifference(customStartDate, customEndDate);
			const monthDiff = this.getMonthDifference(customStartDate, customEndDate);
			
			if (dayDiff <= 7) {
				// ≤ 7 days: Show daily data
				analyticsData = allDailyData;
			} else if (dayDiff <= 30) {
				// ≤ 30 days: Show daily data
				analyticsData = allDailyData;
			} else if (dayDiff <= 90) {
				// ≤ 3 months: Show weekly intervals
				analyticsData = [];
				const dataMap = new Map(allDailyData.map(d => [d.date, d]));
				const currentDate = new Date(customEndDate);
				const weeksToShow = Math.ceil(dayDiff / 7);
				for (let i = 0; i < weeksToShow; i++) {
					const dateStr = currentDate.toISOString().split('T')[0];
					const dataPoint = dataMap.get(dateStr);
					if (dataPoint) {
						analyticsData.unshift(dataPoint);
					} else {
						analyticsData.unshift({
							date: dateStr,
							signups: 0,
							purchases: 0,
							revenue: 0,
							commission: 0,
						});
					}
					currentDate.setDate(currentDate.getDate() - 7);
				}
			} else if (monthDiff <= 35) {
				// ≤ 35 months: Show monthly aggregation
				analyticsData = this.aggregateDataByMonth(allDailyData, monthDiff + 1);
			} else {
				// > 35 months: Show yearly aggregation
				analyticsData = this.aggregateDataByYear(allDailyData);
			}
		} else {
			analyticsData = allDailyData;
		}

		// ===================== TEST DATA - Commented out for future testing =====================
		// Generate test data based on period requirements
		// const allDailyDataTest: Array<{ date: string; signups: number; purchases: number; revenue: number; commission: number }> = [];
        
		// // Generate data for up to 4 years back to support 'all' period
		// const daysToGenerate = period === 'all' ? 365 * 4 : 
		//                        period === '1year' ? 365 : 
		//                        period === '6months' ? 180 : 
		//                        period === '3months' ? 90 : 30;
		
		// for (let i = daysToGenerate; i >= 0; i--) {
		// 	const testDate = new Date(today);
		// 	testDate.setDate(testDate.getDate() - i);
		// 	const dateKey = testDate.toISOString().split('T')[0];
            
		// 	allDailyDataTest.push({
		// 		date: dateKey,
		// 		signups: Math.floor(Math.random() * 50) + 30, // Random 30-80
		// 		purchases: Math.floor(Math.random() * 30) + 15, // Random 15-45
		// 		revenue: Math.floor(Math.random() * 5000) + 3000, // Random 3000-8000
		// 		commission: Math.floor(Math.random() * 1000) + 500, // Random 500-1500
		// 	});
		// }

		// // Process test data based on period
		// let analyticsDataTest: Array<{ date: string; signups: number; purchases: number; revenue: number; commission: number }>;

		// if (period === '7days') {
		// 	analyticsDataTest = allDailyDataTest.slice(-7);
		// } else if (period === '30days') {
		// 	analyticsDataTest = allDailyDataTest;
		// } else if (period === '3months') {
		// 	analyticsDataTest = [];
		// 	const dataMapTest = new Map(allDailyDataTest.map(d => [d.date, d]));
		// 	const currentDateTest = new Date(today);
		// 	for (let i = 0; i < 13; i++) {
		// 		const dateStr = currentDateTest.toISOString().split('T')[0];
		// 		const dataPoint = dataMapTest.get(dateStr);
		// 		if (dataPoint) {
		// 			analyticsDataTest.unshift(dataPoint);
		// 		} else {
		// 			analyticsDataTest.unshift({
		// 				date: dateStr,
		// 				signups: Math.floor(Math.random() * 50) + 30,
		// 				purchases: Math.floor(Math.random() * 30) + 15,
		// 				revenue: Math.floor(Math.random() * 5000) + 3000,
		// 				commission: Math.floor(Math.random() * 1000) + 500,
		// 			});
		// 		}
		// 		currentDateTest.setDate(currentDateTest.getDate() - 7);
		// 	}
		// } else if (period === '6months') {
		// 	analyticsDataTest = this.aggregateDataByMonth(allDailyDataTest, 6);
		// } else if (period === '1year') {
		// 	analyticsDataTest = this.aggregateDataByMonth(allDailyDataTest, 12);
		// } else if (period === 'all') {
		// 	analyticsDataTest = this.aggregateDataByYear(allDailyDataTest);
		// } else if (period === 'custom') {
		// 	// Calculate day and month differences
		// 	const dayDiff = this.getDayDifference(startDate, endDate);
		// 	const monthDiff = this.getMonthDifference(startDate, endDate);
			
		// 	if (dayDiff <= 7) {
		// 		// ≤ 7 days: Show daily data like 7days filter
		// 		analyticsDataTest = allDailyDataTest.slice(-7);
		// 	} else if (dayDiff <= 30) {
		// 		// ≤ 30 days: Show daily data like 30days filter
		// 		analyticsDataTest = allDailyDataTest;
		// 	} else if (dayDiff <= 90) {
		// 		// ≤ 3 months: Show weekly intervals like 3months filter
		// 		analyticsDataTest = [];
		// 		const dataMapCustom = new Map(allDailyDataTest.map(d => [d.date, d]));
		// 		const currentDateCustom = new Date(endDate);
		// 		const weeksToShow = Math.ceil(dayDiff / 7);
		// 		for (let i = 0; i < weeksToShow; i++) {
		// 			const dateStr = currentDateCustom.toISOString().split('T')[0];
		// 			const dataPoint = dataMapCustom.get(dateStr);
		// 			if (dataPoint) {
		// 				analyticsDataTest.unshift(dataPoint);
		// 			} else {
		// 				analyticsDataTest.unshift({
		// 					date: dateStr,
		// 					signups: Math.floor(Math.random() * 50) + 30,
		// 					purchases: Math.floor(Math.random() * 30) + 15,
		// 					revenue: Math.floor(Math.random() * 5000) + 3000,
		// 					commission: Math.floor(Math.random() * 1000) + 500,
		// 				});
		// 			}
		// 			currentDateCustom.setDate(currentDateCustom.getDate() - 7);
		// 		}
		// 	} else if (monthDiff <= 35) {
		// 		// ≤ 35 months: Show monthly aggregation
		// 		analyticsDataTest = this.aggregateDataByMonth(allDailyDataTest, monthDiff + 1);
		// 	} else {
		// 		// > 35 months: Show yearly aggregation
		// 		analyticsDataTest = this.aggregateDataByYear(allDailyDataTest);
		// 	}
		// } else {
		// 	analyticsDataTest = allDailyDataTest;
		// }
		// To use test data, replace 'analyticsData' with 'analyticsDataTest' in the return statement
		//===================== END TEST DATA ===================== */

        this.logger.info('END: getDayWiseProgramAnalytics service');

        return {
            period,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            dailyData: analyticsData,
            dataType: this.getDataType(period, startDate, endDate), 
        };
    }


	private aggregateDataByMonth(
		dailyData: Array<{ date: string; signups: number; purchases: number; revenue: number; commission: number }>,
		numberOfMonths: number,
	): Array<{ date: string; signups: number; purchases: number; revenue: number; commission: number }> {
		const monthlyMap = new Map<string, { signups: number; purchases: number; revenue: number; commission: number }>();
		
		dailyData.forEach(day => {
			const date = new Date(day.date);
			const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
			
			if (!monthlyMap.has(monthKey)) {
				monthlyMap.set(monthKey, { signups: 0, purchases: 0, revenue: 0, commission: 0 });
			}
			
			const monthData = monthlyMap.get(monthKey);
			if (monthData) {
				monthData.signups += day.signups;
				monthData.purchases += day.purchases;
				monthData.revenue += day.revenue;
				monthData.commission += day.commission;
			}
		});
		
		const result = Array.from(monthlyMap.entries())
			.map(([monthKey, data]) => ({
				date: monthKey + '-01', 
				...data,
			}))
			.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
		
		return result.slice(-numberOfMonths);
	}


	private aggregateDataByYear(
		dailyData: Array<{ date: string; signups: number; purchases: number; revenue: number; commission: number }>,
	): Array<{ date: string; signups: number; purchases: number; revenue: number; commission: number }> {
		const yearlyMap = new Map<number, { signups: number; purchases: number; revenue: number; commission: number }>();
		
		dailyData.forEach(day => {
			const year = new Date(day.date).getFullYear();
			
			if (!yearlyMap.has(year)) {
				yearlyMap.set(year, { signups: 0, purchases: 0, revenue: 0, commission: 0 });
			}
			
			const yearData = yearlyMap.get(year);
			if (yearData) {
				yearData.signups += day.signups;
				yearData.purchases += day.purchases;
				yearData.revenue += day.revenue;
				yearData.commission += day.commission;
			}
		});
		
		return Array.from(yearlyMap.entries())
			.map(([year, data]) => ({
				date: `${year}-01-01`,
				...data,
			}))
			.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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
			} else if (dayDiff <= 30) {
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
	async getProgramSummaryList(
		userId: string,
		programId?: string,
		name?: string,
		skip: number = 0,
		take: number = 10,
	) {
		this.logger.info('START: getProgramSummaryList service');

		// Check if user is super admin by checking the User table's role field
		const user = await this.userService.getUserEntity(userId);

		if (!user || user.role !== userRoleEnum.SUPER_ADMIN) {
			this.logger.error(`User ${userId} is not authorized to access program summary. Not a super admin.`);
			throw new ForbiddenException('Only super admins can access program summary list');
		}

		// Note: Materialized views are refreshed by MaterializedViewRefreshService cron job

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

		const result = this.programSummaryViewConverter.convert({
			programs: programSummaries.map(ps => ({
				programId: ps.programId,
				programName: ps.programName,
				totalPromoters: Number(ps.totalPromoters),
				totalReferrals: Number(ps.totalReferrals),
				createdAt: ps.createdAt,
			})),
			pagination: {
				total: totalCount,
				skip,
				take,
				hasMore: skip + take < totalCount,
			},
		});

		this.logger.info('END: getProgramSummaryList service');
		return result;
	}
}
