import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, FindOptionsWhere, Raw, FindOptionsRelations, In } from 'typeorm';
import * as XLSX from 'xlsx';
import {
	CreatePromoterDto,
	CreateMemberDto,
	UpdatePromoterDto,
	UpdatePromoterMemberDto,
} from '../dtos';
import {
	Circle,
	CirclePromoter,
	ProgramPromoter,
	Promoter,
	PromoterMember,
	Purchase,
	ReferralView,
	PromoterAnalyticsView,
	SignUp,
	Link,
	Commission,
	Member,
} from '../entities';
import { MemberService } from './member.service';
import { PromoterConverter } from '../converters/promoter/promoter.dto.converter';
import { PromoterMemberService } from './promoterMember.service';
import { PurchaseConverter } from '../converters/purchase/purchase.dto.converter';
import { QueryOptionsInterface } from '../interfaces/queryOptions.interface';
import { commissionSortByEnum, conversionTypeEnum, linkSortByEnum, memberRoleEnum, memberSortByEnum, promoterStatusEnum, statusEnum } from '../enums';
import { LoggerService } from './logger.service';
import { CommissionConverter } from '../converters/commission/commission.dto.converter';
import { ProgramService } from './program.service';
import { sortOrderEnum } from '../enums/sortOrder.enum';
import { referralSortByEnum } from '../enums/referralSortBy.enum';
import { LinkAnalyticsView } from '../entities';
import { defaultQueryOptions } from '../constants';
import { snakeCaseToHumanReadable, encodeCursor, decodeCursor } from '../utils';
import * as bcrypt from 'bcrypt';
import { SALT_ROUNDS } from '../constants';
import { subjectsType } from '../types';
import { LinkConverter } from 'src/converters/link/link.dto.converter';
import { SignUpConverter } from 'src/converters/signup/signUp.dto.converter';
import { MemberConverter } from 'src/converters/member.converter';
import { ReferralConverter } from 'src/converters/referral.converter';
import { PromoterWorkbookConverter } from 'src/converters/promoter/promoter.workbook.converter';
import { SignUpWorkbookConverter } from 'src/converters/signup/signup.workbook.converter';
import { PurchaseWorkbookConverter } from 'src/converters/purchase/purchase.workbook.converter';
import { LinkWorkbookConverter } from 'src/converters/link/link.workbook.converter';
import { SignupRow, SignUpWorkbook } from '@org-quicko/cliq-sheet-core/SignUp/beans';
import { PurchaseWorkbook } from '@org-quicko/cliq-sheet-core/Purchase/beans';
import { PromoterWorkbook } from '@org-quicko/cliq-sheet-core/Promoter/beans';
import { CommissionWorkbookConverter } from 'src/converters/commission/commission.workbook.converter';
import { CommissionWorkbook } from '@org-quicko/cliq-sheet-core/Commission/beans';
import { LinkWorkbook } from '@org-quicko/cliq-sheet-core/Link/beans';
import { stringify } from 'csv-stringify';
import { Readable } from 'node:stream';

@Injectable()
export class PromoterService {

	private promoterWorkbookConverter: PromoterWorkbookConverter;

	private signUpWorkbookConverter: SignUpWorkbookConverter;

	private purchaseWorkbookConverter: PurchaseWorkbookConverter;

	private linkWorkbookConverter: LinkWorkbookConverter;

	private commissionWorkbookConverter: CommissionWorkbookConverter;

	constructor(
		@InjectRepository(Promoter)
		private promoterRepository: Repository<Promoter>,

		@InjectRepository(PromoterMember)
		private promoterMemberRepository: Repository<PromoterMember>,

		@InjectRepository(Commission)
		private commissionRepository: Repository<Commission>,

		@InjectRepository(SignUp)
		private signUpRepository: Repository<SignUp>,

		@InjectRepository(Link)
		private readonly linkRepository: Repository<Link>,

		@InjectRepository(LinkAnalyticsView)
		private readonly LinkAnalyticsViewRepository: Repository<LinkAnalyticsView>,

		@InjectRepository(Purchase)
		private purchaseRepository: Repository<Purchase>,

		@InjectRepository(ReferralView)
		private referralViewRepository: Repository<ReferralView>,

		@InjectRepository(PromoterAnalyticsView)
		private promoterStatsRepository: Repository<PromoterAnalyticsView>,

		@InjectRepository(ProgramPromoter)
		private programPromoterRepository: Repository<ProgramPromoter>,

		private programService: ProgramService,
		private memberService: MemberService,
		private promoterMemberService: PromoterMemberService,

		private promoterConverter: PromoterConverter,
		private memberConverter: MemberConverter,
		private commissionConverter: CommissionConverter,
		private referralConverter: ReferralConverter,

		private datasource: DataSource,

		private logger: LoggerService,
	) { 
	 	this.promoterWorkbookConverter = new PromoterWorkbookConverter();
		this.signUpWorkbookConverter = new SignUpWorkbookConverter();
		this.purchaseWorkbookConverter = new PurchaseWorkbookConverter();
		this.linkWorkbookConverter = new LinkWorkbookConverter();
		this.commissionWorkbookConverter = new CommissionWorkbookConverter();
	}

	/**
	 * Create promoter
	 */
	async createPromoter(
		programId: string,
		body: CreatePromoterDto,
		memberId?: string,
	) {
		return this.datasource.transaction(async (manager) => {
			this.logger.info('START: createPromoter service');

			const promoterRepository = manager.getRepository(Promoter);

			const promoterEntity = promoterRepository.create(body);
			const savedPromoter = await promoterRepository.save(promoterEntity);

			// in case it's a member creating the promoter, set them to admin
			// but if it's a user, simply the promoter will be created 
			if (memberId) {
				const memberResult = await this.memberService.getMemberEntity(memberId);

				if (await this.memberService.memberExistsInProgram(memberResult.email, programId)) {
					this.logger.error(`Error. Member ${memberResult.email} already exists in Program ${programId} in a promoter`);
					throw new UnauthorizedException(`Error. Member ${memberResult.email} already exists in Program ${programId} in a promoter`);
				}

				const promoterMemberRepository = manager.getRepository(PromoterMember);
				const promoterMember = promoterMemberRepository.create({
					memberId,
					promoterId: savedPromoter.promoterId,
					role: memberRoleEnum.ADMIN,
				});

				// set creator member to admin
				await promoterMemberRepository.save(promoterMember);
			}

			const promoterDto = this.promoterConverter.convert(savedPromoter, false);
			this.logger.info('END: createPromoter service');
			return promoterDto;
		});
	}

	async deletePromoter(memberId: string, programId: string, promoterId: string) {
		return this.datasource.transaction(async (manager) => {
			this.logger.info('START: deletePromoter service');

			const memberRepository = manager.getRepository(Member);
			const promoterRepository = manager.getRepository(Promoter);

			const promoter = await this.getPromoterEntity(promoterId, {
				promoterMembers: true
			});

			if (promoter.promoterMembers.length > 1) {
				this.logger.error(`Error. Cannot delete promoter right now- there are more than one members in it.`);
				throw new BadRequestException(`Error. Cannot delete promoter right now- there are more than one members in it.`);

			}

			const member = await memberRepository.findOne({
				where: {
					memberId,
					promoterMembers: {
						promoterId,
						role: memberRoleEnum.ADMIN
					}
				}
			});

			if (!member) {
				this.logger.error(`Error. Only admin is allowed to delete promoter`);
				throw new BadRequestException(`Error. Only admin is allowed to delete promoter`);
			}

			await memberRepository.remove(member);

			promoter.status = promoterStatusEnum.ARCHIVED;
			await promoterRepository.save(promoter);

			this.logger.info('END: deletePromoter service');
		});
	}

	async updatePromoterInfo(programId: string, promoterId: string, body: UpdatePromoterDto) {
		this.logger.info('START: updatePromoterInfo service');

		const promoter = await this.getPromoterEntity(promoterId, { programPromoters: true });

		Object.assign(promoter, body);
		await this.promoterRepository.save(promoter);

		const acceptedTermsAndConditions = promoter.programPromoters.find(
			programPromoter => programPromoter.programId === programId
		)!.acceptedTermsAndConditions;

		const promoterDto = this.promoterConverter.convert(promoter, acceptedTermsAndConditions);

		this.logger.info('END: updatePromoterInfo service');
		return promoterDto;
	}

	async registerForProgram(acceptedTermsAndConditions: boolean, programId: string, promoterId: string, circleId?: string) {
		return this.datasource.transaction(async (manager) => {

			this.logger.info(`START: registerForProgram service`);

			const isPublic = await this.programService.isProgramPublic(programId);

			const promoterRepository = manager.getRepository(Promoter);
			const programPromoterRepository = manager.getRepository(ProgramPromoter);
			const circleRepository = manager.getRepository(Circle);
			const circlePromoterRepository = manager.getRepository(CirclePromoter);

			if (!isPublic) {
				this.logger.error(`Error. Cannot signup to a private program`);
				throw new BadRequestException(`Error. Cannot signup to a private program`);

			} else {
				const programPromoter = await programPromoterRepository.findOne({ where: { programId, promoterId } });
				if (programPromoter && programPromoter.acceptedTermsAndConditions) {
					this.logger.error(`Error. Promoter is already part of program!`);
					throw new ConflictException(`Error. Promoter is already part of program!`);
				}
			}

			if (!acceptedTermsAndConditions) {
				this.logger.warn(`Warning. Promoter has not accepted terms and conditions.`);
			} else {
				let targetCircleId: string;
				if (circleId) {
					targetCircleId = circleId;
					
				} else {
					// add to program's default circle
					const defaultCircle = await circleRepository.findOne({
						where: {
							program: {
								programId,
							},
							isDefaultCircle: true,
						},
					});
	
					if (!defaultCircle) {
						this.logger.error(
							`Error. Default Circle not found for Program ${programId}`,
						);
						throw new InternalServerErrorException(
							`Error. Default Circle not found for Program ${programId}`,
						);
					}

					targetCircleId = defaultCircle.circleId;
				}

				const circlePromoter = circlePromoterRepository.create({
					circleId: targetCircleId,
					promoterId,
				});
				await circlePromoterRepository.save(circlePromoter);
			}

			const programPromoter = programPromoterRepository.create({
				programId,
				promoterId,
				acceptedTermsAndConditions
			});

			await programPromoterRepository.save(programPromoter);

			const promoter = await promoterRepository.findOneOrFail({ where: { promoterId } });
			const promoterDto = this.promoterConverter.convert(promoter, acceptedTermsAndConditions);

			this.logger.info(`END: registerForProgram service`);
			return promoterDto;
		});
	}

	/**
	 * Get promoter
	 */
	async getPromoter(programId: string, promoterId: string) {
		this.logger.info('START: getPromoter service');

		await this.programService.getProgramEntity(programId);

		const promoter = await this.promoterRepository.findOne({
			where: {
				promoterId,
			},
			relations: {
				programPromoters: true
			}
		});

		if (!promoter) {
			this.logger.warn(`Failed to get Promoter ${promoterId}`);
			throw new NotFoundException(`Failed to get promoter for promoter_id: ${promoterId}`);
		}

		const programPromoterResult = promoter.programPromoters.find(
			programPromoter => programPromoter.programId === programId
		);

		let acceptedTermsAndConditions: boolean;
		if (programPromoterResult) {
			acceptedTermsAndConditions = programPromoterResult.acceptedTermsAndConditions;

			if (!acceptedTermsAndConditions) {
				this.logger.warn(`Warning. Promoter has not accepted terms and conditions.`);
			}
		} else {
			this.logger.error(`Error. Promoter ${promoterId} is not part of Program ${programId}`);
			throw new NotFoundException(`Error. Promoter ${promoterId} is not part of Program ${programId}`);
		}

		const promoterDto = this.promoterConverter.convert(promoter, acceptedTermsAndConditions)
		this.logger.info('END: getPromoter service');
		return promoterDto;
	}

	/**
	 * Get promoter entity
	 */
	async getPromoterEntity(promoterId: string, relations: FindOptionsRelations<Promoter> = {}) {
		this.logger.info('START: getPromoterEntity service');
		const promoter = await this.promoterRepository.findOne({
			where: {
				promoterId,
			},
			relations
		});

		if (!promoter) {
			this.logger.warn(`Failed to get Promoter ${promoterId}`);
			throw new NotFoundException(
				`Failed to get promoter for promoter_id: ${promoterId}`,
			);
		}

		this.logger.info('END: getPromoterEntity service');
		return promoter;
	}

	/**
	 * Check for authorization, whether member can access a promoter's information
	 */
	async memberExistsInPromoter(memberId: string, promoterId: string, subject: subjectsType) {
		this.logger.info('START: memberExistsInPromoter service');

		const memberResult = await this.promoterMemberRepository.findOne({
			where: {
				promoterId,
				memberId
			},
		});

		this.logger.info('END: memberExistsInPromoter service');
		return memberResult === null ? memberResult : subject;
	}

	/**
	 * Invite member
	 */
	async addMember(
		programId: string,
		promoterId: string,
		body: CreateMemberDto,
	) {
		return this.datasource.transaction(async (manager) => {
			this.logger.info('START: addMember service');

			const memberRepository = manager.getRepository(Member);

			// First check if member exists in any promoter (returns false if account doesn't exist at all)
			const memberExistsInProgram = await this.memberService.memberExistsInProgram(
				body.email,
				programId,
			);

			// member does exist in at least 1 promoter => deny entry in another promoter
			if (memberExistsInProgram) {
				this.logger.error(`Error. Member already exists in a promoter, cannot join another promoter.`);
				throw new ConflictException(`Error. Member already exists in a promoter, cannot join another promoter.`);
			}

			// now get the member and check if the member account exists
			const existingMember = (await this.memberService.getMemberByEmail(programId, body.email));
			if (existingMember) {

				// Check if there's an existing promoter-member relationship
				const promoterMember = await this.promoterMemberService.getPromoterMemberRowEntity(promoterId, existingMember.memberId, {
					member: true
				});

				// If promoter-member relationship exists
				if (promoterMember) {

					// Only allow reactivation if status is INACTIVE
					if (promoterMember.status === statusEnum.INACTIVE) {
						const salt = await bcrypt.genSalt(SALT_ROUNDS);
						existingMember.password = await bcrypt.hash(body.password, salt);

						Object.assign(existingMember, { firstName: body.firstName, lastName: body.lastName });

						await memberRepository.save(existingMember);

						await this.promoterMemberRepository.update(
							{
								promoterId: promoterMember.promoterId,
								memberId: promoterMember.memberId,
							},
							{
								status: statusEnum.ACTIVE,
								role: body.role,
								updatedAt: () => `NOW()`,
							},
						);

						const memberSheetJson = this.promoterWorkbookConverter.convertTo({
							memberSheetInput: {
								promoterMembers: [promoterMember],
								promoterId,
								count: 1
							}
						});

						this.logger.info('END: addMember service');
						return memberSheetJson;
					}

					throw new ConflictException('Member is already active for this promoter');
				}

				// If no promoter-member relationship exists, create one
				const newPromoterMember = manager.create(PromoterMember, {
					promoterId,
					memberId: existingMember.memberId,
					role: body.role,
					status: statusEnum.ACTIVE,
					member: existingMember
				});

				const promoterMemberResult = await manager.save(newPromoterMember);

				const memberSheetJson = this.promoterWorkbookConverter.convertTo({
					memberSheetInput: {
						promoterMembers: [promoterMemberResult],
						promoterId,
						count: 1
					}
				});

				this.logger.info('END: addMember service');
				return memberSheetJson;
			}


			// If member doesn't exist, create new member and promoter-member relationship
			if (await this.memberService.memberExistsInProgram(body.email, programId)) {
				this.logger.error(`Error. Email ${body.email} is already part of Program ${programId}`);
				throw new BadRequestException(`Error. Email ${body.email} is already part of Program ${programId}`);
			}

			const newMember = memberRepository.create({
				...body,
				program: {
					programId,
				},
			});
			await memberRepository.save(newMember);


			if (!newMember || !newMember.memberId) {
				this.logger.warn('Failed to create member');
				throw new InternalServerErrorException(
					'Failed to create member',
				);
			}

			const promoterMember = manager.create(PromoterMember, {
				promoterId,
				memberId: newMember.memberId,
				role: body.role,
				status: statusEnum.ACTIVE,
				member: newMember
			});

			const promoterMemberResult = await manager.save(promoterMember);

			const memberSheetJson = this.promoterWorkbookConverter.convertTo({
				memberSheetInput: {
					promoterMembers: [promoterMemberResult],
					promoterId,
					count: 1
				}
			});

			this.logger.info('END: addMember service');
			return memberSheetJson;
		});
	}

	/**
	 * Get all members
	 */
	async getAllMembers(
		promoterId: string,
		sortBy?: memberSortByEnum,
		sortOrder: sortOrderEnum = sortOrderEnum.DESCENDING,
		toUseSheetJsonFormat: boolean = false,
		whereOptions: FindOptionsWhere<PromoterMember> = {},
		queryOptions: QueryOptionsInterface = defaultQueryOptions,
	) {
		this.logger.info('START: getAllMembers service');

		const [promoterMembers, count] = await this.promoterMemberRepository.findAndCount({
			where: {
				promoterId,
				...whereOptions,
			},
			relations: {
				member: true,
			},
			order: {
				member: {
					...(sortBy === memberSortByEnum.NAME && {
						firstName: sortOrder,
						lastName: sortOrder,
					}),

				}
			},
			...queryOptions,
		});

		if (!promoterMembers || promoterMembers.length == 0) {
			this.logger.warn(
				`Failed to get members for Promoter ${promoterId}`,
			);
			throw new NotFoundException(
				`Failed to get members for promoter_id: ${promoterId}`,
			);
		}

		if (toUseSheetJsonFormat) {
			const membersSheetJson = this.promoterWorkbookConverter.convertTo({
				memberSheetInput: {
					promoterMembers: promoterMembers,
					promoterId,
					count,
					queryOptions
				}
			});

			this.logger.info('END: getAllMembers service');
			return membersSheetJson;
		}

		const membersDto = promoterMembers.map((pm) =>
			this.memberConverter.convert(pm.member, pm),
		);

		this.logger.info('END: getAllMembers service');
		return membersDto;
	}

	/**
	 * Update role
	 */
	async updateRole(memberId: string, targetMemberId: string, body: UpdatePromoterMemberDto) {
		this.logger.info('START: updateRole service');

		if (memberId === targetMemberId) {
			this.logger.error(`Error. Cannot change role of self.`);
			throw new BadRequestException(`Error. Cannot change role of self.`);
		}

		const member = await this.memberService.getMemberEntity(targetMemberId);

		if (!member) {
			this.logger.warn(`Error. Failed to get Member ${targetMemberId}`);
			throw new NotFoundException(`Error. Failed to get member ${targetMemberId}`);
		}

		await this.promoterMemberRepository.update({ memberId: targetMemberId }, {
			role: body.role,
			updatedAt: () => `NOW()`,
		});

		this.logger.info('END: updateRole service');
	}

	/**
	 * Remove member
	 */
	async removeMember(promoterId: string, memberId: string) {
		this.logger.info('START: removeMember service');

		await this.promoterMemberRepository.update(
			{
				promoterId,
				memberId,
			},
			{ status: statusEnum.INACTIVE, updatedAt: () => `NOW()` },
		);

		this.logger.info('END: removeMember service');
	}


	/**
	 * Get signups for promoter
	 */
	async getSignUpsForPromoter(
		programId: string,
		promoterId: string,
		toUseSheetJsonFormat: boolean = true,
		whereOptions: FindOptionsWhere<SignUp> = {},
		startDate?: Date,
		endDate?: Date,
		cursor?: string,
		limit: number = 1000,
	) {
		this.logger.info('START: getSignUpsForPromoter service');

		await this.hasAcceptedTermsAndConditions(programId, promoterId);

		// Optimized query using query builder with cursor-based pagination
		const queryBuilder = this.signUpRepository
			.createQueryBuilder('signUp')
			.innerJoinAndSelect('signUp.contact', 'contact')
			.where('signUp.promoterId = :promoterId', { promoterId })
			.andWhere('contact.programId = :programId', { programId });

		// Apply date filters with proper indexing support
		if (startDate && endDate) {
			queryBuilder
				.andWhere('signUp.createdAt >= :startDate', { startDate: startDate.toISOString() })
				.andWhere('signUp.createdAt <= :endDate', { endDate: endDate.toISOString() });
		}

		// Apply cursor-based pagination for efficient retrieval
		if (cursor) {
			const cursorDate = decodeCursor(cursor);
			queryBuilder.andWhere('signUp.createdAt > :cursorDate', { cursorDate: cursorDate.toISOString() });
		}

		// Add ordering for consistent results and cursor pagination
		queryBuilder
			.orderBy('signUp.createdAt', 'ASC')
			.addOrderBy('signUp.contactId', 'ASC') // Secondary sort for deterministic ordering
			.limit(limit);

		const signUpsResult = await queryBuilder.getMany();

		

		if (!signUpsResult || signUpsResult.length === 0) {
			this.logger.warn(
				`failed to get signups for promoter ${promoterId}`,
			);
		}

		// Generate next cursor for pagination
		let nextCursor: string | null = null;
		if (signUpsResult.length === limit && signUpsResult.length > 0) {
			const lastItem = signUpsResult[signUpsResult.length - 1];
			nextCursor = encodeCursor(lastItem.createdAt);
		}

		if (toUseSheetJsonFormat) {
			const promoterWorkbook = this.promoterWorkbookConverter.convertTo({
				signUpSheetInput: {
					signUps: signUpsResult
				}
			});

			this.logger.info('END: getSignUpsForPromoter service: Returning Workbook');
			return promoterWorkbook;
		}

		this.logger.info('END: getSignUpsForPromoter service');
		return {
			data: signUpsResult,
			pagination: {
				hasNextPage: nextCursor !== null,
				nextCursor,
				limit,
				count: signUpsResult.length
			}
		};
	}

	/**
	 * Get purchases for promoter
	 */
	async getPurchasesForPromoter(
		programId: string,
		promoterId: string,
		toUseSheetJsonFormat: boolean = true,
		whereOptions: FindOptionsWhere<Purchase> = {},
		startDate?: Date,
		endDate?: Date,
		cursor?: string,
		limit: number = 1000,
	) {
		this.logger.info('START: getPurchasesForPromoter service');

		await this.hasAcceptedTermsAndConditions(programId, promoterId);

		// Highly optimized query using INNER JOIN with cursor-based pagination
		const queryBuilder = this.purchaseRepository
			.createQueryBuilder('purchase')
			.innerJoinAndSelect('purchase.contact', 'contact')
			.where('purchase.promoterId = :promoterId', { promoterId })
			.andWhere('contact.programId = :programId', { programId });

		// Apply date filters with proper indexing support
		if (startDate && endDate) {
			queryBuilder
				.andWhere('purchase.createdAt >= :startDate', { startDate: startDate.toISOString() })
				.andWhere('purchase.createdAt <= :endDate', { endDate: endDate.toISOString() });
		}

		// Apply cursor-based pagination for efficient retrieval
		if (cursor) {
			const cursorDate = decodeCursor(cursor);
			queryBuilder.andWhere('purchase.createdAt > :cursorDate', { cursorDate: cursorDate.toISOString() });
		}

		// Add ordering for consistent results and cursor pagination
		queryBuilder
			.orderBy('purchase.createdAt', 'ASC')
			.addOrderBy('purchase.purchaseId', 'ASC') // Secondary sort for deterministic ordering
			.limit(limit);

		const purchases = await queryBuilder.getMany();

		if (!purchases) {
			this.logger.warn(`failed to get purchases for promoter ${promoterId}`);
			throw new NotFoundException(`No purchases found for ${promoterId}`);
		}


		// Generate next cursor for pagination
		let nextCursor: string | null = null;
		if (purchases.length === limit && purchases.length > 0) {
			const lastItem = purchases[purchases.length - 1];
			nextCursor = encodeCursor(lastItem.createdAt);
		}

		if (toUseSheetJsonFormat) {
			const purchaseSheetJson = this.promoterWorkbookConverter.convertTo({
				purchaseSheetInput: {
					purchases,
				}
			});

			this.logger.info('END: getPurchasesForPromoter service: Returning Workbook');
			return purchaseSheetJson;
		}

		this.logger.info('END: getPurchasesForPromoter service');
		return {
			data: purchases,
			pagination: {
				hasNextPage: nextCursor !== null,
				nextCursor,
				limit,
				count: purchases.length
			}
		};
	}

	async getPromoterReferrals(
		memberId: string,
		programId: string,
		promoterId: string,
		sortBy?: referralSortByEnum,
		sortOrder: sortOrderEnum = sortOrderEnum.DESCENDING,
		toUseSheetJsonFormat: boolean = true,
		whereOptions: FindOptionsWhere<ReferralView> = {},
		queryOptions: QueryOptionsInterface = defaultQueryOptions,
	) {
		this.logger.info(`START: getPromoterReferrals service`);

		// checking if the program and promoter exist
		await this.programService.getProgram(programId);
		await this.getPromoter(programId, promoterId);

		await this.hasAcceptedTermsAndConditions(programId, promoterId);

		try {
			await this.promoterMemberService.getPromoterMemberRowEntity(promoterId, memberId);
		} catch (error) {
			if (error instanceof NotFoundException) {
				this.logger.error(`Error. Member ${memberId} is not part of Promoter ${promoterId}`);
				throw new ForbiddenException(`Error. Member ${memberId} is not part of Promoter ${promoterId}`);
			} else {
				throw error;
			}
		}

		const [referralResult, count] = await this.referralViewRepository.findAndCount({
			where: {
				programId,
				promoterId,
				...whereOptions
			},
			...(sortBy && { order: { [sortBy as string]: sortOrder } }),
			...queryOptions
		});

		if (toUseSheetJsonFormat) {
			const promoterWorkbook = this.promoterWorkbookConverter.convertTo({
				referralSheetInput: {
					referrals: referralResult,
					metadata: {
						count
					}
				}
			});

			this.logger.info(`END: getPromoterReferrals service: Returning Workbook`);
			return promoterWorkbook;
		}


		this.logger.info(`END: getPromoterReferrals service`);
		return referralResult;
	}

	async getPromoterReferral(
		programId: string,
		promoterId: string,
		contactId: string,
	) {
		this.logger.info(`START: getPromoterReferral service`);

		// checking if the program and promoter exist
		await this.programService.getProgram(programId);
		await this.getPromoter(programId, promoterId);

		await this.hasAcceptedTermsAndConditions(programId, promoterId);

		const referralResult = await this.referralViewRepository.findOne({
			where: {
				programId,
				promoterId,
				contactId,
			},
		});

		if (!referralResult) {
			this.logger.error(`Error. Referral not found for contactId ${contactId}`);
			throw new NotFoundException(`Error. Referral not found for contactId ${contactId}`);
		}

		const referralDto = this.referralConverter.convertTo(referralResult);

		this.logger.info(`END: getPromoterReferral service`);
		return referralDto;
	}

	async hasAcceptedTermsAndConditions(programId: string, promoterId: string) {
		this.logger.info(`START: hasAcceptedTermsAndConditions service`);

		const programPromoterRow = await this.programPromoterRepository.findOne({
			where: {
				programId,
				promoterId,
				acceptedTermsAndConditions: true
			}
		});

		if (!programPromoterRow) {
			this.logger.error(`Error. Promoter ${promoterId} not found in Program ${programId}.`);
			throw new BadRequestException(`Error. Promoter ${promoterId} not found in Program ${programId}.`);

		} else if (!programPromoterRow.acceptedTermsAndConditions) {
			this.logger.error(`Error. Promoter ${promoterId} hasn't accepted terms and conditions required for Program ${programId}.`);
			throw new BadRequestException(`Error. Promoter ${promoterId} hasn't accepted terms and conditions required for Program ${programId}.`);

		}

		this.logger.info(`END: hasAcceptedTermsAndConditions service -> TNC accepted`);
	}

	/**
	 * Get promoter commissions
	 */
	async getPromoterCommissions(
		programId: string,
		promoterId: string,
		sortBy?: commissionSortByEnum,
		sortOrder: sortOrderEnum = sortOrderEnum.DESCENDING,
		toUseSheetJsonFormat: boolean = true,
		whereOptions: FindOptionsWhere<Commission> = {},
		queryOptions: QueryOptionsInterface = defaultQueryOptions,
	) {
		this.logger.info('START: getPromoterCommissions service');

		const referralKeyType = (await this.programService.getProgramEntity(programId)).referralKeyType;

		await this.hasAcceptedTermsAndConditions(programId, promoterId);

		const [commissionResult, count] = await this.commissionRepository.findAndCount({
			where: {
				promoter: {
					promoterId,
					programPromoters: {
						programId
					}
				},
				...whereOptions,
			},
			relations: {
				link: true,
				contact: true
			},
			...(sortBy && { order: { [sortBy as string]: sortOrder } }),
			...queryOptions
		})

		if (!commissionResult) {
			this.logger.warn(`No commissions found for promoter ${promoterId}`);
			throw new NotFoundException(`No commissions found for promoter ${promoterId}`);
		}

		if (toUseSheetJsonFormat) {
			const promoterWorkbook = this.promoterWorkbookConverter.convertTo({
				commissionSheetInput: {
					commissions: commissionResult,
					referralKeyType,
					metadata: {
						count,
					}
				}
			});

			this.logger.info(`END: getPromoterCommissions service: Returning Workbook`);
			return promoterWorkbook;
		}

		const commissionDtos = commissionResult.map((commission) =>
			this.commissionConverter.convert(commission),
		);

		this.logger.info('END: getPromoterCommissions service');
		return commissionDtos;
	}

	/**
	 * Get signups report
	 */
	async getSignUpsReport(
		programId: string,
		promoterId: string,
		memberId: string,
		startDate: Date,
		endDate: Date,
	) {
		this.logger.info('START: getSignUpsReport service');

		try {
			await this.promoterMemberService.getPromoterMemberRowEntity(promoterId, memberId);
		} catch (error) {
			if (error instanceof NotFoundException) {
				this.logger.error(`Error. Member ${memberId} is not part of Promoter ${promoterId}`);
				throw new ForbiddenException(`Error. Member ${memberId} is not part of Promoter ${promoterId}`);
			} else {
				throw error;
			}
		}

		await this.hasAcceptedTermsAndConditions(programId, promoterId);

		const filter = {
			createdAt: Raw((alias) => `${alias} >= :start AND ${alias} <= :end`, {
				start: startDate.toISOString(),
				end: endDate.toISOString(),
			})
		};

		let signUpsResult: SignUp[] = [];
		let cursor: string | undefined = undefined;
		let hasNextPage = true;

		// Fetch all signups by paginating through all pages
		while (hasNextPage) {
			const signUpsResponse = await this.getSignUpsForPromoter(programId, promoterId, false, filter, startDate, endDate, cursor, 1000);
			const response = signUpsResponse as any;
			
			// Append current page data to the result array
			signUpsResult.push(...response.data);
			
			// Update pagination state
			hasNextPage = response.pagination.hasNextPage;
			cursor = response.pagination.nextCursor || undefined;
			
			this.logger.info(`Fetched ${response.pagination.count} signups. Total so far: ${signUpsResult.length}`);
		}

		this.logger.info(`Completed fetching all signups. Total count: ${signUpsResult.length}`);

		const promoterResult = await this.getPromoterEntity(promoterId);
		const signUpsCommissions = await this.getSignUpsCommissions(programId, promoterId, startDate, endDate);


		const signUpSheetJsonWorkbook = this.signUpWorkbookConverter.convertFrom(signUpsResult, signUpsCommissions, promoterResult, startDate, endDate);

		const signUpCSV = this.generateSignUpCSVStream(signUpSheetJsonWorkbook);


		this.logger.info('END: getSignUpsReport service');
		return signUpCSV;
	}


    /**
     * Creates a readable stream that generates CSV data row-by-row.
     * This is highly memory-efficient as it doesn't load the whole file into memory.
     * @param signupWorkbook - The workbook data source.
     * @returns A Readable stream outputting CSV data.
     */
    private generateSignUpCSVStream(signupWorkbook: SignUpWorkbook): Readable {
        const signUpsTable = signupWorkbook.getSignupSheet().getSignupTable();
        const len = signUpsTable.getRows().length;
        let rowIndex = 0;

        const columns = [
            { key: 'contactId', header: 'contact_id' },
            { key: 'signUpDate', header: 'sign_up_date' },
            { key: 'email', header: 'email' },
            { key: 'phone', header: 'phone' },
            { key: 'commission', header: 'commission' },
            { key: 'externalId', header: 'external_id' },
            { key: 'utmId', header: 'utm_id' },
            { key: 'utmSource', header: 'utm_source' },
            { key: 'utmMedium', header: 'utm_medium' },
            { key: 'utmCampaign', header: 'utm_campaign' },
            { key: 'utmTerm', header: 'utm_term' },
            { key: 'utmContent', header: 'utm_content' },
        ];

        // 1. Create a source stream from your data array
        const sourceStream = new Readable({
            objectMode: true,
            read() {
				const row = signUpsTable.getRow(rowIndex++);
                if (row) {
                    // 2. Push one transformed row object at a time
                    this.push({
                        contactId: row?.getContactId(),
                        signUpDate: row.getSignUpDate(),
                        email: row?.getEmail() ?? '',
                        phone: row?.getPhone() ?? '',
                        commission: Number(row?.getCommission()).toString(),
                        externalId: row.getExternalId() ?? '',
                        utmId: row.getUtmId() ?? '',
                        utmSource: row.getUtmSource() ?? '',
                        utmMedium: row.getUtmMedium() ?? '',
                        utmCampaign: row.getUtmCampaign() ?? '',
                        utmTerm: row.getUtmTerm() ?? '',
                        utmContent: row.getUtmContent() ?? '',
                    });
                } else {
                    this.push(null); // 3. Signal that there's no more data
                }
            },
        });

        // 4. Create the CSV stringifier stream
        const stringifier = stringify({
            header: true,
            columns,
        });

        // 5. Pipe the source data through the stringifier and return the result
        return sourceStream.pipe(stringifier);
    }

    /**
     * Creates a readable stream that generates CSV data row-by-row for purchases.
     * This is highly memory-efficient as it doesn't load the whole file into memory.
     * @param purchaseWorkbook - The workbook data source.
     * @returns A Readable stream outputting CSV data.
     */
    private generatePurchaseCSVStream(purchaseWorkbook: PurchaseWorkbook): Readable {
        const purchasesTable = purchaseWorkbook.getPurchaseSheet().getPurchaseTable();
        const rows = purchasesTable.getRows();
        let rowIndex = 0;

        const columns = [
            { key: 'purchaseId', header: 'purchase_id' },
            { key: 'contactId', header: 'contact_id' },
            { key: 'purchaseDate', header: 'purchase_date' },
            { key: 'itemId', header: 'item_id' },
            { key: 'amount', header: 'amount' },
            { key: 'commission', header: 'commission' },
            { key: 'externalId', header: 'external_id' },
            { key: 'utmId', header: 'utm_id' },
            { key: 'utmSource', header: 'utm_source' },
            { key: 'utmMedium', header: 'utm_medium' },
            { key: 'utmCampaign', header: 'utm_campaign' },
            { key: 'utmTerm', header: 'utm_term' },
            { key: 'utmContent', header: 'utm_content' },
        ];

        // 1. Create a source stream from your data array
        const sourceStream = new Readable({
            objectMode: true,
            read() {
                if (rowIndex < rows.length) {
                    const row = purchasesTable.getRow(rowIndex++);
                    // 2. Push one transformed row object at a time
                    this.push({
                        purchaseId: row?.getPurchaseId(),
                        contactId: row?.getContactId(),
                        purchaseDate: row.getPurchaseDate(),
                        itemId: row?.getItemId() ?? '',
                        amount: Number(row?.getAmount()).toString(),
                        commission: Number(row?.getCommission()).toString(),
                        externalId: row.getExternalId() ?? '',
                        utmId: row.getUtmId() ?? '',
                        utmSource: row.getUtmSource() ?? '',
                        utmMedium: row.getUtmMedium() ?? '',
                        utmCampaign: row.getUtmCampaign() ?? '',
                        utmTerm: row.getUtmTerm() ?? '',
                        utmContent: row.getUtmContent() ?? '',
                    });
                } else {
                    this.push(null); // 3. Signal that there's no more data
                }
            },
        });

        // 4. Create the CSV stringifier stream
        const stringifier = stringify({
            header: true,
            columns,
        });

        // 5. Pipe the source data through the stringifier and return the result
        return sourceStream.pipe(stringifier);
    }

    /**
     * Generates a CSV stream for purchase commission data.
     * @param purchaseTable The purchase table containing commission data.
     * @returns A Readable stream outputting CSV data.
     */
    private generatePurchaseCommissionCSVStream(commissionWorkbook: CommissionWorkbook): Readable {
        const purchaseTable = commissionWorkbook.getPurchaseSheet().getPurchaseTable();
        const rows = purchaseTable.getRows();
        let rowIndex = 0;

        const columns = [
            { key: 'purchaseId', header: 'purchase_id' },
            { key: 'contactId', header: 'contact_id' },
            { key: 'purchaseDate', header: 'purchase_date' },
            { key: 'itemId', header: 'item_id' },
            { key: 'amount', header: 'amount' },
            { key: 'commission', header: 'commission' },
            { key: 'externalId', header: 'external_id' },
            { key: 'utmId', header: 'utm_id' },
            { key: 'utmSource', header: 'utm_source' },
            { key: 'utmMedium', header: 'utm_medium' },
            { key: 'utmCampaign', header: 'utm_campaign' },
            { key: 'utmTerm', header: 'utm_term' },
            { key: 'utmContent', header: 'utm_content' },
        ];

        // 1. Create a source stream from your data array
        const sourceStream = new Readable({
            objectMode: true,
            read() {
                if (rowIndex < rows.length) {
                    const row = purchaseTable.getRow(rowIndex++);
                    // 2. Push one transformed row object at a time
                    this.push({
                        purchaseId: row?.getPurchaseId(),
                        contactId: row?.getContactId(),
                        purchaseDate: row.getPurchaseDate(),
                        itemId: row?.getItemId() ?? '',
                        amount: Number(row?.getAmount()).toString(),
                        commission: Number(row?.getCommission()).toString(),
                        externalId: row.getExternalId() ?? '',
                        utmId: row.getUtmId() ?? '',
                        utmSource: row.getUtmSource() ?? '',
                        utmMedium: row.getUtmMedium() ?? '',
                        utmCampaign: row.getUtmCampaign() ?? '',
                        utmTerm: row.getUtmTerm() ?? '',
                        utmContent: row.getUtmContent() ?? '',
                    });
                } else {
                    this.push(null); // 3. Signal that there's no more data
                }
            },
        });

        // 4. Create the CSV stringifier stream
        const stringifier = stringify({
            header: true,
            columns,
        });

        // 5. Pipe the source data through the stringifier and return the result
        return sourceStream.pipe(stringifier);
    }

    /**
     * Generates a CSV stream for signup commission data.
     * @param signupTable The signup table containing commission data.
     * @returns A Readable stream outputting CSV data.
     */
    private generateSignupCommissionCSVStream(commissionWorkbook: CommissionWorkbook): Readable {
        const signUpsTable = commissionWorkbook.getSignupSheet().getSignupTable();
        const rows = signUpsTable.getRows();
        let rowIndex = 0;
        
        const columns = [
            { key: 'contactId', header: 'contact_id' },
            { key: 'signUpDate', header: 'sign_up_date' },
            { key: 'email', header: 'email' },
            { key: 'phone', header: 'phone' },
            { key: 'commission', header: 'commission' },
            { key: 'externalId', header: 'external_id' },
            { key: 'utmId', header: 'utm_id' },
            { key: 'utmSource', header: 'utm_source' },
            { key: 'utmMedium', header: 'utm_medium' },
            { key: 'utmCampaign', header: 'utm_campaign' },
            { key: 'utmTerm', header: 'utm_term' },
            { key: 'utmContent', header: 'utm_content' },
        ];
        
        const stringifier = stringify({
            header: true,
            columns,
        });
        
        const sourceStream = new Readable({
            objectMode: true,
            read() {
                if (rowIndex < rows.length) {
                    const row = signUpsTable.getRow(rowIndex++);
                    this.push({
                        contactId: row?.getContactId(),
                        signUpDate: row.getSignUpDate(),
                        email: row?.getEmail() ?? '',
                        phone: row?.getPhone() ?? '',
                        commission: Number(row?.getCommission()).toString(),
                        externalId: row.getExternalId() ?? '',
                        utmId: row.getUtmId() ?? '',
                        utmSource: row.getUtmSource() ?? '',
                        utmMedium: row.getUtmMedium() ?? '',
                        utmCampaign: row.getUtmCampaign() ?? '',
                        utmTerm: row.getUtmTerm() ?? '',
                        utmContent: row.getUtmContent() ?? '',
                    });
                } else {
                    this.push(null); // 3. Signal that there's no more data
                }
            },
        });
        
        return sourceStream.pipe(stringifier);
    }

	/**
	 * Get purchases report
	 */
	async getPurchasesReport(
		programId: string,
		promoterId: string,
		memberId: string,
		startDate: Date,
		endDate: Date,
	) {
		this.logger.info('START: getPurchasesReport service');

		try {
			await this.promoterMemberService.getPromoterMemberRowEntity(promoterId, memberId);
		} catch (error) {
			if (error instanceof NotFoundException) {
				this.logger.error(`Error. Member ${memberId} is not part of Promoter ${promoterId}`);
				throw new ForbiddenException(`Error. Member ${memberId} is not part of Promoter ${promoterId}`);
			} else {
				throw error;
			}
		}

		await this.hasAcceptedTermsAndConditions(programId, promoterId);

		const filter = {
			createdAt: Raw((alias) => `${alias} >= :start AND ${alias} <= :end`, {
				start: startDate.toISOString(),
				end: endDate.toISOString(),
			})
		};

		let purchasesResult: Purchase[] = [];
		let cursor: string | undefined = undefined;
		let hasNextPage = true;

		// Fetch all purchases by paginating through all pages
		while (hasNextPage) {
			const purchasesResponse = await this.getPurchasesForPromoter(programId, promoterId, false, filter, startDate, endDate, cursor, 1000);
			const response = purchasesResponse as any;
			
			// Append current page data to the result array
			purchasesResult.push(...response.data);
			
			// Update pagination state
			hasNextPage = response.pagination.hasNextPage;
			cursor = response.pagination.nextCursor || undefined;
			
			this.logger.info(`Fetched ${response.pagination.count} purchases. Total so far: ${purchasesResult.length}`);
		}

		this.logger.info(`Completed fetching all purchases. Total count: ${purchasesResult.length}`);

		const promoterResult = await this.getPromoterEntity(promoterId);
		const purchasesCommissions = await this.getPurchasesCommissions(programId, promoterId, startDate, endDate);

		const purchaseSheetJsonWorkbook = this.purchaseWorkbookConverter.convertFrom(purchasesResult, purchasesCommissions, promoterResult, startDate, endDate);

		const purchaseCSV = this.generatePurchaseCSVStream(purchaseSheetJsonWorkbook);

		this.logger.info('END: getPurchasesReport service');
		return purchaseCSV;
	}

	/**
	 * Get referrals report
	 */
	async getReferralsReport(
		memberId: string,
		programId: string,
		promoterId: string,
		startDate: Date,
		endDate: Date,
	) {
		this.logger.info('START: getReferralsReport service');

		try {
			await this.promoterMemberService.getPromoterMemberRowEntity(promoterId, memberId);
		} catch (error) {
			if (error instanceof NotFoundException) {
				this.logger.error(`Error. Member ${memberId} is not part of Promoter ${promoterId}`);
				throw new ForbiddenException(`Error. Member ${memberId} is not part of Promoter ${promoterId}`);
			} else {
				throw error;
			}
		}

		await this.hasAcceptedTermsAndConditions(programId, promoterId);

		const filter = {
			createdAt: Raw((alias) => `${alias} >= :start AND ${alias} <= :end`, {
				start: startDate.toISOString(),
				end: endDate.toISOString(),
			})
		};

		const referralsResult = await this.getPromoterReferrals(memberId, programId, promoterId, undefined, undefined, true, filter) as PromoterWorkbook;

		const referralTable = referralsResult.getReferralSheet().getReferralTable();

		const workbook = PromoterWorkbook.toXlsx(referralsResult);
		const sheetData: any[] = [snakeCaseToHumanReadable(referralTable.getHeader())];

		referralTable.getRows().map(row => {
			sheetData.push(row);
		});

		// Remove the snake_case sheets
		workbook.SheetNames = workbook.SheetNames.filter(name => 
			!name.includes('_sheet')
		);

		const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Referrals');

		const fileBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

		this.logger.info('END: getReferralsReport service');
		return fileBuffer;
	}

	async getCommissionsReport(
		programId: string,
		promoterId: string,
		memberId: string,
		startDate: Date,
		endDate: Date,
	): Promise<{ purchaseStream: Readable; signupStream: Readable }> {
		this.logger.info(`START: getCommissionsReport service`);

		try {
			await this.promoterMemberService.getPromoterMemberRowEntity(promoterId, memberId);
		} catch (error) {
			if (error instanceof NotFoundException) {
				this.logger.error(`Error. Member ${memberId} is not part of Promoter ${promoterId}`);
				throw new ForbiddenException(`Error. Member ${memberId} is not part of Promoter ${promoterId}`);
			} else {
				throw error;
			}
		}

		await this.hasAcceptedTermsAndConditions(programId, promoterId);

		const filter = {
			createdAt: Raw((alias) => `${alias} >= :start AND ${alias} <= :end`, {
				start: startDate.toISOString(),
				end: endDate.toISOString(),
			})
		};

		
		// Fetch all signups by paginating through all pages
		let signUpsResult: SignUp[] = [];
		let signUpsCursor: string | undefined = undefined;
		let signUpsHasNextPage = true;

		while (signUpsHasNextPage) {
			const signUpsResponse = await this.getSignUpsForPromoter(programId, promoterId, false, filter, startDate, endDate, signUpsCursor, 1000);
			const response = signUpsResponse as any;
			
			// Append current page data to the result array
			signUpsResult.push(...response.data);
			
			// Update pagination state
			signUpsHasNextPage = response.pagination.hasNextPage;
			signUpsCursor = response.pagination.nextCursor || undefined;
			
			this.logger.info(`Fetched ${response.pagination.count} signups. Total so far: ${signUpsResult.length}`);
		}

		this.logger.info(`Completed fetching all signups. Total count: ${signUpsResult.length}`);

		// Fetch all purchases by paginating through all pages
		let purchasesResult: Purchase[] = [];
		let purchasesCursor: string | undefined = undefined;
		let purchasesHasNextPage = true;

		while (purchasesHasNextPage) {
			const purchasesResponse = await this.getPurchasesForPromoter(programId, promoterId, false, filter, startDate, endDate, purchasesCursor, 1000);
			const response = purchasesResponse as any;
			
			// Append current page data to the result array
			purchasesResult.push(...response.data);
			
			// Update pagination state
			purchasesHasNextPage = response.pagination.hasNextPage;
			purchasesCursor = response.pagination.nextCursor || undefined;
			
			this.logger.info(`Fetched ${response.pagination.count} purchases. Total so far: ${purchasesResult.length}`);
		}

		this.logger.info(`Completed fetching all purchases. Total count: ${purchasesResult.length}`);

		const signUpsCommissions = await this.getSignUpsCommissions(programId, promoterId, startDate, endDate);
		const purchasesCommissions = await this.getPurchasesCommissions(programId, promoterId, startDate, endDate);

		const promoterResult = await this.getPromoterEntity(promoterId);

		const commissionSheetJsonWorkbook = this.commissionWorkbookConverter.convertFrom(
			signUpsResult,
			purchasesResult,
			signUpsCommissions,
			purchasesCommissions,
			promoterResult,
			startDate,
			endDate,
		);

		// Generate CSV streams for purchases and signups
		const purchaseStream = this.generatePurchaseCommissionCSVStream(commissionSheetJsonWorkbook);
		const signupStream = this.generateSignupCommissionCSVStream(commissionSheetJsonWorkbook);

		this.logger.info(`END: getCommissionsReport service`);
		return { purchaseStream, signupStream };
	}

	private async getSignUpsCommissions(programId: string, promoterId: string, startDate: Date, endDate: Date): Promise<Map<string, Commission>> {
		const signUpsCommissions: Map<string, Commission> = new Map();

		const commissions = await this.commissionRepository.query(`
			SELECT 
				c.commission_id as "commissionId",
				c.external_id as "externalId",
				c.amount,
				c.revenue,
				c.created_at as "createdAt",
				c.updated_at as "updatedAt"
			FROM commission c
			INNER JOIN sign_up su ON c.external_id = su.contact_id
			INNER JOIN contact ct ON su.contact_id = ct.contact_id
			WHERE c.conversion_type = $1 
				AND c.promoter_id = $2
				AND ct.program_id = $3
				AND su.created_at >= $4 
				AND su.created_at <= $5
			ORDER BY c.created_at ASC
		`, [conversionTypeEnum.SIGNUP, promoterId, programId, startDate.toISOString(), endDate.toISOString()]);

		// Map commissions by contactId (externalId)
		for (const commission of commissions) {
			signUpsCommissions.set(commission.externalId, commission);
		}

		return signUpsCommissions;
	}

	private async getPurchasesCommissions(programId: string, promoterId: string, startDate: Date, endDate: Date): Promise<Map<string, Commission[]>> {
		const purchasesCommissionsMap: Map<string, Commission[]> = new Map();
		
		const commissions = await this.commissionRepository.query(`
			SELECT 
				c.commission_id as "commissionId",
				c.external_id as "externalId",
				c.amount,
				c.revenue,
				c.created_at as "createdAt",
				c.updated_at as "updatedAt"
			FROM commission c
			INNER JOIN purchase p ON c.external_id = p.purchase_id
			INNER JOIN contact ct ON p.contact_id = ct.contact_id
			WHERE c.conversion_type = $1
				AND c.promoter_id = $2
				AND ct.program_id = $3
				AND p.created_at >= $4
				AND p.created_at <= $5
			ORDER BY c.created_at ASC
		`, [conversionTypeEnum.PURCHASE, promoterId, programId, startDate.toISOString(), endDate.toISOString()]);

		// Group commissions by purchaseId (stored as externalId)
		for (const commission of commissions) {
			const purchaseId = commission.externalId;
			if (!purchasesCommissionsMap.has(purchaseId)) {
				purchasesCommissionsMap.set(purchaseId, []);
			}
			purchasesCommissionsMap.get(purchaseId)!.push(commission);
		}

		return purchasesCommissionsMap;
	}

	async getLinksReport(
		programId: string,
		promoterId: string,
		memberId: string,
		startDate: Date,
		endDate: Date,
	) {
		this.logger.info(`START: getLinksReport service`);

		try {
			await this.promoterMemberService.getPromoterMemberRowEntity(promoterId, memberId);
		} catch (error) {
			if (error instanceof NotFoundException) {
				this.logger.error(`Error. Member ${memberId} is not part of Promoter ${promoterId}`);
				throw new ForbiddenException(`Error. Member ${memberId} is not part of Promoter ${promoterId}`);
			} else {
				throw error;
			}
		}

		await this.hasAcceptedTermsAndConditions(programId, promoterId);

		const filter = {
			createdAt: Raw((alias) => `${alias} >= :start AND ${alias} <= :end`, {
				start: startDate.toISOString(),
				end: endDate.toISOString(),
			})
		};

		const linksResult = await this.linkRepository.find({
			where: {
				programId,
				promoterId,
				...filter,
			},
			relations: {
				commissions: true,
				program: true,
			}
		});

		const linkSignUpsMap = await this.getNumberOfSignUpsOnLinks(linksResult);
		const linkPurchasesMap = await this.getPurchasesOnLinks(linksResult);

		const linkSheetJsonWorkbook = this.linkWorkbookConverter.convertFrom(linksResult, linkSignUpsMap, linkPurchasesMap, startDate, endDate);

		const workbook = LinkWorkbook.toXlsx(linkSheetJsonWorkbook);

		// getting table and list
		const linksTable = linkSheetJsonWorkbook.getLinkSheet().getLinkTable();
		const linkSummaryList = linkSheetJsonWorkbook.getLinkSummarySheet().getLinkSummaryList();

		const linksSheetData: any[] = [snakeCaseToHumanReadable(linksTable.getHeader())];
		const linksSummarySheetData: any[] = [];

		linksTable.getRows().map(row => {
			linksSheetData.push(row);
		});

		linkSummaryList.getItems().forEach((item) => {
			linksSummarySheetData.push([snakeCaseToHumanReadable(item.getKey()), item.getValue()]);
		})

		const summarySheet = XLSX.utils.aoa_to_sheet(linksSummarySheetData);
		const linksSheet = XLSX.utils.aoa_to_sheet(linksSheetData);

		// Remove the snake_case sheets
		workbook.SheetNames = workbook.SheetNames.filter(name => 
			!name.includes('_sheet')
		);

		XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
		XLSX.utils.book_append_sheet(workbook, linksSheet, 'Links');

		const fileBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

		this.logger.info(`END: getLinksReport service`);
		return fileBuffer;
	}

	private async getNumberOfSignUpsOnLinks(links: Link[]) {
		this.logger.info(`START: getSignUpsOnLinks service`);

		const linkIds = links.map(link => link.linkId);

		const signUps = await this.signUpRepository.find({
			where: {
				linkId: In(linkIds)
			}
		});

		const linkSignUpsMap: Map<string, number> = new Map();
		for (const signUp of signUps) {
			if (!linkSignUpsMap.has(signUp.linkId)) {
				linkSignUpsMap.set(signUp.linkId, 0);
			}

			linkSignUpsMap.set(signUp.linkId, linkSignUpsMap.get(signUp.linkId)! + 1);
		}

		this.logger.info(`END: getSignUpsOnLinks service`);
		return linkSignUpsMap;
	}

	private async getPurchasesOnLinks(links: Link[]) {
		this.logger.info(`START: getPurchasesOnLinks service`);

		const linkIds = links.map(link => link.linkId);

		const purchases = await this.purchaseRepository.find({
			where: {
				linkId: In(linkIds)
			}
		});

		const linkPurchasesMap: Map<string, Purchase[]> = new Map();
		for (const purchase of purchases) {
			if (!linkPurchasesMap.has(purchase.linkId)) {
				linkPurchasesMap.set(purchase.linkId, []);
			}

			linkPurchasesMap.get(purchase.linkId)!.push(purchase);
		}

		this.logger.info(`END: getPurchasesOnLinks service`);
		return linkPurchasesMap;	
	}

	async getPromoterAnalytics(
		programId: string,
		promoterId: string,
		toUseSheetJsonFormat: boolean = true,
	): Promise<PromoterWorkbook | PromoterAnalyticsView> {
		this.logger.info(`START: getPromoterAnalytics service`);

		// checking if the program and promoter exist
		await this.programService.getProgram(programId);
		await this.getPromoter(programId, promoterId);

		await this.hasAcceptedTermsAndConditions(programId, promoterId);

		const promoterStatsResult = await this.promoterStatsRepository.findOne(
			{
				where: {
					programId,
					promoterId,
				},
			},
		);

		let referralDto;
		if (!promoterStatsResult) {
			referralDto = this.promoterStatsRepository.create({
				programId,
				promoterId,
				totalCommission: 0,
				totalRevenue: 0,
				totalSignUps: 0,
				totalPurchases: 0,
			});
		} else {
			referralDto = promoterStatsResult;
		}

		if (toUseSheetJsonFormat) {
			const promoterWorkbook = this.promoterWorkbookConverter.convertTo({
				promoterAnalyticsSheetInput: {
					promoterAnalytics: [
						promoterStatsResult ?? {
							programId,
							promoterId,
							totalCommission: 0,
							totalRevenue: 0,
							totalSignUps: 0,
							totalPurchases: 0,
							createdAt: new Date(),
							updatedAt: new Date(),
						}
					]
				}
			});

			this.logger.info(`END: getPromoterAnalytics service: Returning Workbook`);

			return promoterWorkbook;
		}

		this.logger.info(`END: getPromoterAnalytics service`);
		return referralDto;
	}

	async getPromoterLinkAnalytics(
		programId: string,
		promoterId: string,
		sortBy?: linkSortByEnum,
		sortOrder: sortOrderEnum = sortOrderEnum.DESCENDING,
		toUseSheetJsonFormat: boolean = true,
		queryOptions: QueryOptionsInterface = defaultQueryOptions
	) {
		this.logger.info(`START: getPromoterLinkAnalytics service`);

		await this.hasAcceptedTermsAndConditions(programId, promoterId);

		const [linkStatsResult, count] = await this.LinkAnalyticsViewRepository.findAndCount({
			where: {
				programId,
				promoterId,
			},
			...(sortBy && { order: { [sortBy as string]: sortOrder } }),
			...queryOptions
		});

		const programResult = await this.programService.getProgramEntity(programId);

		if (toUseSheetJsonFormat) {
			const promoterWorkbook = this.promoterWorkbookConverter.convertTo({
				linkAnalyticsInput: {
					linkAnalytics: linkStatsResult,
					metadata: {
						programId,
						website: programResult.website,
						count
					}
				}
			});

			this.logger.info(`START: getPromoterLinkAnalytics service: Returning Workbook`);
			return promoterWorkbook;
		}

		this.logger.info(`END: getPromoterLinkAnalytics service`);
		return linkStatsResult;
	}

}
