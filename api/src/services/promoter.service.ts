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
import { snakeCaseToHumanReadable } from '../utils';
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
import { SignUpWorkbook } from '@org-quicko/cliq-sheet-core/SignUp/beans';
import { PurchaseWorkbook } from '@org-quicko/cliq-sheet-core/Purchase/beans';
import { PromoterWorkbook } from '@org-quicko/cliq-sheet-core/Promoter/beans';
import { CommissionWorkbookConverter } from 'src/converters/commission/commission.workbook.converter';
import { CommissionWorkbook } from '@org-quicko/cliq-sheet-core/Commission/beans';
import { LinkWorkbook } from '@org-quicko/cliq-sheet-core/Link/beans';

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
		whereOptions: FindOptionsWhere<Purchase> = {},
	) {
		this.logger.info('START: getSignUpsForPromoter service');

		await this.hasAcceptedTermsAndConditions(programId, promoterId);

		// getting signups for: program -> promoter -> signups
		const signUpsResult = await this.signUpRepository.find({
			where: {
				promoterId,
				contact: {
					programId
				},
				...whereOptions
			},
			relations: {
				contact: true
			},
		});

		

		if (!signUpsResult || signUpsResult.length === 0) {
			this.logger.warn(
				`failed to get signups for promoter ${promoterId}`,
			);
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
		return signUpsResult;
	}

	/**
	 * Get purchases for promoter
	 */
	async getPurchasesForPromoter(
		programId: string,
		promoterId: string,
		toUseSheetJsonFormat: boolean = true,
		whereOptions: FindOptionsWhere<Purchase> = {},
	) {
		this.logger.info('START: getPurchasesForPromoter service');

		await this.hasAcceptedTermsAndConditions(programId, promoterId);

		const purchases = await this.purchaseRepository.find({
			where: {
				promoterId,
				contact: {
					programId,
					commissions: {

					}
				},
				...whereOptions
			},
			relations: {
				contact: true
			},
		});

		if (!purchases) {
			this.logger.warn(`failed to get purchases for promoter ${promoterId}`);
			throw new NotFoundException(`No purchases found for ${promoterId}`);
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
		return purchases;
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

		const signUpsResult = await this.getSignUpsForPromoter(programId, promoterId, false, filter) as SignUp[];
		const promoterResult = await this.getPromoterEntity(promoterId);
		const signUpsCommissions = await this.getSignUpsCommissions(signUpsResult);


		const signUpSheetJsonWorkbook = this.signUpWorkbookConverter.convertFrom(signUpsResult, signUpsCommissions, promoterResult, startDate, endDate);

		const signUpsTable = signUpSheetJsonWorkbook.getSignupSheet().getSignupTable();
		const signUpSummaryList = signUpSheetJsonWorkbook.getSignupSummarySheet().getSignupSummaryList();

		const workbook = SignUpWorkbook.toXlsx(signUpSheetJsonWorkbook);
		const signUpsSheetData: any[] = [snakeCaseToHumanReadable(signUpsTable.getHeader())];
		const signUpsSummarySheetData: any[] = [];

		signUpsTable.getRows().map(row => {
			signUpsSheetData.push(row);
		});

		signUpSummaryList.getItems().forEach((item) => {
			signUpsSummarySheetData.push([snakeCaseToHumanReadable(item.getKey()), item.getValue()]);
		})

		const summarySheet = XLSX.utils.aoa_to_sheet(signUpsSummarySheetData);
		const signUpsSheet = XLSX.utils.aoa_to_sheet(signUpsSheetData);

		// Remove the snake_case sheets
		workbook.SheetNames = workbook.SheetNames.filter(name => 
			!name.includes('_sheet')
		);

		XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
		XLSX.utils.book_append_sheet(workbook, signUpsSheet, 'Signups');

		const fileBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

		this.logger.info('END: getSignUpsReport service');
		return fileBuffer;
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

		const purchasesResult = await this.getPurchasesForPromoter(programId, promoterId, false, filter) as Purchase[];
		const promoterResult = await this.getPromoterEntity(promoterId);
		const purchasesCommissions = await this.getPurchasesCommissions(purchasesResult);

		const purchaseSheetJsonWorkbook = this.purchaseWorkbookConverter.convertFrom(purchasesResult, purchasesCommissions, promoterResult, startDate, endDate);

		const purchasesTable = purchaseSheetJsonWorkbook.getPurchaseSheet().getPurchaseTable();
		const purchaseSummaryList = purchaseSheetJsonWorkbook.getPurchaseSummarySheet().getPurchaseSummaryList();
		const workbook = PurchaseWorkbook.toXlsx(purchaseSheetJsonWorkbook);
		const purchasesSheetData: any[] = [snakeCaseToHumanReadable(purchasesTable.getHeader())];
		const purchasesSummarySheetData: any[] = [];

		purchasesTable.getRows().map(row => {
			purchasesSheetData.push(row);
		});

		purchaseSummaryList.getItems().forEach((item) => {
			purchasesSummarySheetData.push([snakeCaseToHumanReadable(item.getKey()), item.getValue()]);
		});

		const summarySheet = XLSX.utils.aoa_to_sheet(purchasesSummarySheetData);
		const purchasesSheet = XLSX.utils.aoa_to_sheet(purchasesSheetData);

		// Remove the snake_case sheets
		workbook.SheetNames = workbook.SheetNames.filter(name => 
			!name.includes('_sheet')
		);

		XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
		XLSX.utils.book_append_sheet(workbook, purchasesSheet, 'Purchases');

		const fileBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });


		this.logger.info('END: getPurchasesReport service');
		return fileBuffer;
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
	) {
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

		const signUpsResult = await this.getSignUpsForPromoter(programId, promoterId, false, filter) as SignUp[];
		const purchasesResult = await this.getPurchasesForPromoter(programId, promoterId, false, filter) as Purchase[];
		const signUpsCommissions = await this.getSignUpsCommissions(signUpsResult);
		const purchasesCommissions = await this.getPurchasesCommissions(purchasesResult);

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

		// get both tables and the list
		const purchasesTable = commissionSheetJsonWorkbook.getPurchaseSheet().getPurchaseTable();
		const signUpsTable = commissionSheetJsonWorkbook.getSignupSheet().getSignupTable();
		const commissionSummaryList = commissionSheetJsonWorkbook.getCommissionSummarySheet().getCommissionSummaryList();

		const workbook = CommissionWorkbook.toXlsx(commissionSheetJsonWorkbook);

		// all 3 sheets
		const purchasesSheetData: any[] = [snakeCaseToHumanReadable(purchasesTable.getHeader())];
		const signUpsSheetData: any[] = [snakeCaseToHumanReadable(signUpsTable.getHeader())];
		const commissionsSummarySheetData: any[] = [];

		// pushing purchase data
		purchasesTable.getRows().map(row => {
			purchasesSheetData.push(row);
		});

		// pushing signups data
		signUpsTable.getRows().map(row => {
			signUpsSheetData.push(row);
		});

		// pushing commissions summary data
		commissionSummaryList.getItems().forEach((item) => {
			commissionsSummarySheetData.push([snakeCaseToHumanReadable(item.getKey()), item.getValue()]);
		})

		// entering data to sheet
		const summarySheet = XLSX.utils.aoa_to_sheet(commissionsSummarySheetData);
		const purchasesSheet = XLSX.utils.aoa_to_sheet(purchasesSheetData);
		const signUpsSheet = XLSX.utils.aoa_to_sheet(signUpsSheetData);

		// Remove the snake_case sheets
		workbook.SheetNames = workbook.SheetNames.filter(name => 
			!name.includes('_sheet')
		);

		// adding sheet to workbook
		XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
		XLSX.utils.book_append_sheet(workbook, purchasesSheet, 'Purchases');
		XLSX.utils.book_append_sheet(workbook, signUpsSheet, 'Signups');

		const fileBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

		this.logger.info(`END: getCommissionsReport service`);
		return fileBuffer;
	}

	private async getSignUpsCommissions(signUps: SignUp[]): Promise<Map<string, Commission>> {
		const contactIds = signUps.map(signUp => signUp.contactId);

		const commissions = await this.commissionRepository.find({
			where: {
				conversionType: conversionTypeEnum.SIGNUP,
				externalId: In(contactIds),
			}
		});

		// Map commissions by contactId (externalId)
		const signUpsCommissions: Map<string, Commission> = new Map();
		for (const commission of commissions) {
			signUpsCommissions.set(commission.externalId, commission);
		}

		return signUpsCommissions;
	}

	private async getPurchasesCommissions(purchases: Purchase[]): Promise<Map<string, Commission[]>> {
		const purchaseIds = purchases.map(p => p.purchaseId);

		// Single optimized query
		const commissions = await this.commissionRepository.find({
			where: {
				conversionType: conversionTypeEnum.PURCHASE,
				externalId: In(purchaseIds),
			},
		});

		// Group commissions by purchaseId (stored as externalId)
		const purchaseCommissionsMap = new Map<string, Commission[]>();

		for (const commission of commissions) {
			const purchaseId = commission.externalId;
			if (!purchaseCommissionsMap.has(purchaseId)) {
				purchaseCommissionsMap.set(purchaseId, []);
			}
			purchaseCommissionsMap.get(purchaseId)!.push(commission);
		}

		return purchaseCommissionsMap;
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
