import {
	ConflictException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Brackets, FindOptionsWhere, Raw } from 'typeorm';
import * as XLSX from 'xlsx';
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
	ReferralAggregateView,
	SignUp,
	Link,
	Commission,
} from '../entities';
import { MemberService } from './member.service';
import { PromoterConverter } from '../converters/promoter.converter';
import { PromoterMemberService } from './promoterMember.service';
import { MemberConverter } from '../converters/member.converter';
import { ContactConverter } from '../converters/contact.converter';
import { PurchaseConverter } from '../converters/purchase.converter';
import { QueryOptionsInterface } from '../interfaces/queryOptions.interface';
import { roleEnum, statusEnum } from '../enums';
import { LoggerService } from './logger.service';
import { SignUpConverter } from '../converters/signUp.converter';
import { CommissionConverter } from '../converters/commission.converter';
import { ProgramService } from './program.service';
import { sortOrderEnum } from '../enums/sortOrder.enum';
import { referralSortByEnum } from '../enums/referralSortBy.enum';
import { LinkStatsView } from '../entities/link.view';
import { ReferralConverter } from '../converters/referral.converter';
import { LinkConverter } from '../converters/link.converter';
import { CommissionWorkbook, LinkWorkbook, PromoterInterfaceWorkbook, SignUpWorkbook } from 'generated/sources';
import { defaultQueryOptions } from '../constants';
import { snakeCaseToHumanReadable } from '../utils';

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

		@InjectRepository(Link)
		private readonly linkRepository: Repository<Link>,

		@InjectRepository(LinkStatsView)
		private readonly linkStatsViewRepository: Repository<LinkStatsView>,

		@InjectRepository(Purchase)
		private purchaseRepository: Repository<Purchase>,

		@InjectRepository(ReferralView)
		private referralViewRepository: Repository<ReferralView>,

		@InjectRepository(ReferralAggregateView)
		private referralAggregateViewRepository: Repository<ReferralAggregateView>,


		private programService: ProgramService,
		private memberService: MemberService,
		private promoterMemberService: PromoterMemberService,

		private promoterConverter: PromoterConverter,
		private linkConverter: LinkConverter,
		private memeberConverter: MemberConverter,
		private contactConverter: ContactConverter,
		private purchaseConverter: PurchaseConverter,
		private signUpConverter: SignUpConverter,
		private commissionConverter: CommissionConverter,
		private referralConverter: ReferralConverter,

		private datasource: DataSource,

		private logger: LoggerService,
	) { }

	/**
	 * Create promoter
	 */
	async createPromoter(
		memberId: string,
		programId: string,
		body: CreatePromoterDto,
	) {
		return this.datasource.transaction(async (manager) => {
			this.logger.info('START: createPromoter service');

			const memberResult = await this.memberService.getMemberEntity(memberId);

			if (await this.memberService.memberExistsInAnyPromoter(memberResult.email, programId)) {
				this.logger.error(`Error. Member ${memberResult.email} already exists in Program ${programId} in a promoter`);
				throw new UnauthorizedException(`Error. Member ${memberResult.email} already exists in Program ${programId} in a promoter`);
			}

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
				promoterId: savedPromoter.promoterId,
			});

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
		this.logger.info('START: getPromoter service');
		const promoter = await this.promoterRepository.findOne({
			where: {
				promoterId,
			},
		});

		if (!promoter) {
			this.logger.warn(`Failed to get Promoter ${promoterId}`);
			throw new NotFoundException(
				`Failed to get promoter for promoter_id: ${promoterId}`,
			);
		}

		this.logger.info('END: getPromoter service');
		return this.promoterConverter.convert(promoter);
	}

	/**
	 * Get promoter entity
	 */
	async getPromoterEntity(promoterId: string) {
		this.logger.info('START: getPromoterEntity service');
		const promoter = await this.promoterRepository.findOne({
			where: {
				promoterId,
			},
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
	 * Invite member
	 */
	async inviteMember(
		programId: string,
		promoterId: string,
		body: InviteMemberDto,
	) {
		return this.datasource.transaction(async (manager) => {
			this.logger.info('START: inviteMember service');

			// First check if member exists in any promoter (returns false if account doesn't exist at all)
			const memberExistsInAnyPromoter = await this.memberService.memberExistsInAnyPromoter(
				body.email,
				programId,
			);

			// member does exist in at least 1 promoter => deny entry in another promoter
			if (memberExistsInAnyPromoter) {
				this.logger.error(`Error. Member already exists in a promoter, cannot join another promoter.`);
				throw new ConflictException(`Error. Member already exists in a promoter, cannot join another promoter.`);
			}

			// now get the member and check if the member account exists
			const existingMember = (await this.memberService.getMemberByEmail(body.email));

			if (existingMember) {

				// Check if there's an existing promoter-member relationship
				const promoterMember =
					await this.promoterMemberService.getPromoterMemberRowEntity(
						promoterId,
						existingMember.memberId,
					);

				// If promoter-member relationship exists
				if (promoterMember) {
					// Only allow reactivation if status is INACTIVE
					if (promoterMember.status === statusEnum.INACTIVE) {
						await this.promoterMemberRepository.update(
							{
								promoterId: promoterMember.promoterId,
								memberId: promoterMember.memberId,
							},
							{
								status: statusEnum.ACTIVE,
								updatedAt: Date.now(),
							},
						);

						return {
							email: existingMember.email,
							firstName: existingMember.firstName,
							lastName: existingMember.lastName,
							role: promoterMember.role,
						} as InviteMemberDto;
					}

					throw new ConflictException(
						'Member is already active for this promoter',
					);
				}

				// If no promoter-member relationship exists, create one
				const newPromoterMember = manager.create(PromoterMember, {
					memberId: existingMember.memberId,
					promoterId,
					role: body.role,
					status: statusEnum.ACTIVE,
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
				throw new InternalServerErrorException(
					'Failed to create member',
				);
			}

			const promoterMember = manager.create(PromoterMember, {
				memberId: newMember.memberId,
				promoterId,
				role: body.role,
				status: statusEnum.ACTIVE,
			});

			await manager.save(promoterMember);

			this.logger.info('END: inviteMember service');

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
	async getAllMembers(
		promoterId: string,
		toUseSheetJsonFormat: boolean = false,
		whereOptions: FindOptionsWhere<PromoterMember> = {},
		queryOptions: QueryOptionsInterface = defaultQueryOptions,
	) {
		this.logger.info('START: getAllMembers service');

		const promoterMembers = await this.promoterMemberRepository.find({
			where: {
				promoter: {
					promoterId: promoterId,
				},
				...whereOptions,
			},
			relations: {
				member: true,
			},
			select: {
				member: {
					memberId: true,
					email: true,
					firstName: true,
					lastName: true,
					createdAt: true
				},
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
			const membersSheetJson = this.memeberConverter.convertToSheetJson(promoterMembers, promoterId, queryOptions);

			this.logger.info('END: getAllMembers service');
			return membersSheetJson;
		}

		const membersDto = promoterMembers.map((pm) =>
			this.memeberConverter.convert(pm.member, pm),
		);

		this.logger.info('END: getAllMembers service');
		return membersDto;
	}

	/**
	 * Update role
	 */
	async updateRole(memberId: string, body: UpdatePromoterMemberDto) {
		this.logger.info('START: updateRole service');

		const member = await this.memberService.getMember(memberId);

		if (!member) {
			this.logger.warn(`failed to get Member ${memberId}`);
			throw new NotFoundException('Failed to get member');
		}

		await this.promoterMemberRepository.update(
			{
				memberId,
			},
			{
				role: body.role,
				updatedAt: () => `NOW()`,
			},
		);
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
		queryOptions: QueryOptionsInterface = defaultQueryOptions,
	) {
		this.logger.info('START: getSignUpsForPromoter service');

		// getting signups for: program -> promoter -> signups
		const signUpsResult = await this.signUpRepository.find({
			where: {
				promoterId,
				promoter: {
					programPromoters: {
						program: {
							programId,
						},
					},
				},
				...whereOptions
			},
			relations: {
				contact: {
					commissions: true,
				},
				link: true
			},
			...queryOptions,
		});

		if (!signUpsResult || signUpsResult.length === 0) {
			this.logger.warn(
				`failed to get signups for promoter ${promoterId}`,
			);
			throw new NotFoundException(
				`No signups found for promoter ${promoterId}`,
			);
		}

		if (toUseSheetJsonFormat) {
			const signUpSheetJson = this.signUpConverter.convertToSheetJson(signUpsResult, queryOptions);

			this.logger.info('END: getSignUpsForPromoter service: Returning Workbook');
			return signUpSheetJson;
		}

		this.logger.info('END: getSignUpsForPromoter service');
		return signUpsResult;
	}

	//  * Get contacts for promoter
	//  */
	async getContactsForPromoter(
		programId: string,
		promoterId: string,
		queryOptions: QueryOptionsInterface = defaultQueryOptions,
	) {
		this.logger.info('START: getContactsForPromoter service');

		const contacts = await this.contactRepository
			.createQueryBuilder('contact')
			.leftJoinAndSelect('contact.program', 'program')
			.leftJoinAndSelect('contact.purchases', 'purchase')
			.leftJoinAndSelect('contact.signup', 'signup')
			.where('program.program_id = :programId', { programId })
			.andWhere(
				new Brackets((qb) => {
					qb.where('purchase.promoter_id = :promoterId', {
						promoterId,
					}).orWhere('signup.promoter_id = :promoterId', {
						promoterId,
					});
				}),
			)
			.skip(queryOptions.skip)
			.take(queryOptions.take)
			.getMany();

		if (!contacts || contacts.length === 0) {
			this.logger.warn(
				`failed to get contacts for promoter ${promoterId}`,
			);
			throw new NotFoundException(
				`No contacts found for promoter ${promoterId}`,
			);
		}

		const contactDtos = contacts.map((contact) =>
			this.contactConverter.convert(contact),
		);

		this.logger.info('END: getContactsForPromoter service');
		return contactDtos;
	}

	/**
	 * Get purchases for promoter
	 */
	async getPurchasesForPromoter(
		programId: string,
		promoterId: string,
		toUseSheetJsonFormat: boolean = true,
		whereOptions: FindOptionsWhere<Purchase> = {},
		queryOptions: QueryOptionsInterface = defaultQueryOptions,

	) {
		this.logger.info('START: getPurchasesForPromoter service');

		const purchases = await this.purchaseRepository.find({
			where: {
				promoter: {
					promoterId,
				},
				contact: {
					programId,
				},
				...whereOptions,
			},
			select: {
				purchaseId: true,
				amount: true,
				createdAt: true,
				itemId: true,
			},
			relations: {
				link: true,
				contact: {
					commissions: true,
				}
			},
			...queryOptions,
		});

		if (!purchases) {
			this.logger.warn(`failed to get purchases for promoter ${promoterId}`);
			throw new NotFoundException(`No purchases found for ${promoterId}`);
		}


		if (toUseSheetJsonFormat) {
			const purchaseSheetJson = this.purchaseConverter.convertToSheetJson(purchases, queryOptions);

			this.logger.info('END: getPurchasesForPromoter service: Returning Workbook');

			return purchaseSheetJson;
		}

		this.logger.info('END: getPurchasesForPromoter service');
		return purchases;
	}


	async getPromoterReferrals(
		programId: string,
		promoterId: string,
		sortBy?: referralSortByEnum,
		sortOrder: sortOrderEnum = sortOrderEnum.DESCENDING,
		toUseSheetJsonFormat: boolean = true,
		whereOptions: FindOptionsWhere<Purchase> = {},
		queryOptions: QueryOptionsInterface = defaultQueryOptions,
	) {
		this.logger.info(`START: getPromoterReferrals service`);

		// checking if the program and promoter exist
		await this.programService.getProgram(programId);
		await this.getPromoter(promoterId);

		const referralResult = await this.referralViewRepository.find({
			where: {
				promoterId,
				...whereOptions
			},
			...(sortBy && { order: { [sortBy as string]: sortOrder } }),
			...queryOptions
		});

		if (toUseSheetJsonFormat) {
			const commissionSheetJson = this.referralConverter.convertReferralViewToSheet(referralResult);

			this.logger.info(`END: getPromoterReferrals service: Returning Workbook`);
			return commissionSheetJson;
		}


		this.logger.info(`END: getPromoterReferrals service`);
		return referralResult;
	}

	/**
	 * Get promoter commissions
	 */
	async getPromoterCommissions(
		programId: string,
		promoterId: string,
		toUseSheetJsonFormat: boolean = true,
		whereOptions: FindOptionsWhere<Commission> = {},
		queryOptions: QueryOptionsInterface = defaultQueryOptions,
	) {
		this.logger.info('START: getPromoterCommissions service');

		const promoterResult = await this.promoterRepository.findOne({
			where: {
				promoterId,
				programPromoters: {
					program: {
						programId,
					},
				},
				...whereOptions
			},
			relations: {
				commissions: true,
			},
			...queryOptions,
		});

		if (
			!promoterResult ||
			!promoterResult.commissions ||
			promoterResult.commissions.length === 0
		) {
			this.logger.warn(
				`failed to get commissions for promoter ${promoterId}`,
			);
			throw new NotFoundException(
				`No commissions found for promoter ${promoterId}`,
			);
		}

		if (toUseSheetJsonFormat) {
			const commissionSheetJson = this.commissionConverter.convertToSheet(promoterResult.commissions);

			this.logger.info(`END: getPromoterCommissions service: Returning Workbook`);
			return commissionSheetJson;
		}

		const commissionDtos = promoterResult.commissions.map((commission) =>
			this.commissionConverter.convert(commission),
		);

		this.logger.info('END: getPromoterCommissions service');
		return commissionDtos;
	}

	/**
	 * Get contacts report
	 */
	async getSignUpsReport(
		programId: string,
		promoterId: string,
		startDate: Date,
		endDate: Date,
	) {
		this.logger.info('START: getSignUpsReport service');

		const filter = {
			createdAt: Raw((alias) => `${alias} BETWEEN :start AND :end`, {
				start: startDate.toISOString(),
				end: endDate.toISOString(),
			})
		};

		const signUpsResult = await this.getSignUpsForPromoter(programId, promoterId, false, filter) as SignUp[];
		const promoterResult = await this.getPromoterEntity(promoterId);

		const signUpSheetJsonWorkbook = this.signUpConverter.convertToReportWorkbook(signUpsResult, promoterResult, startDate, endDate);

		const signUpsTable = signUpSheetJsonWorkbook.getSwSignups().getSignupsTable();
		const signUpSummaryList = signUpSheetJsonWorkbook.getSwSummary().getSignupsSummaryList();

		const workbook = SignUpWorkbook.toXlsx();
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
		startDate: Date,
		endDate: Date,
	) {
		this.logger.info('START: getPurchasesReport service');

		const filter = {
			createdAt: Raw((alias) => `${alias} BETWEEN :start AND :end`, {
				start: startDate.toISOString(),
				end: endDate.toISOString(),
			})
		};

		const purchasesResult = await this.getPurchasesForPromoter(programId, promoterId, false, filter) as Purchase[];

		const promoterResult = await this.getPromoterEntity(promoterId);

		const purchaseSheetJsonWorkbook = this.purchaseConverter.convertToReportWorkbook(purchasesResult, promoterResult, startDate, endDate);

		const purchasesTable = purchaseSheetJsonWorkbook.getPwPurchases().getPurchasesTable();
		const purchaseSummaryList = purchaseSheetJsonWorkbook.getPwSummary().getPurchasesSummaryList();

		const workbook = SignUpWorkbook.toXlsx();
		const purchasesSheetData: any[] = [snakeCaseToHumanReadable(purchasesTable.getHeader())];
		const purchasesSummarySheetData: any[] = [];

		purchasesTable.getRows().map(row => {
			purchasesSheetData.push(row);
		});

		purchaseSummaryList.getItems().forEach((item) => {
			purchasesSummarySheetData.push([snakeCaseToHumanReadable(item.getKey()), item.getValue()]);
		})

		const summarySheet = XLSX.utils.aoa_to_sheet(purchasesSummarySheetData);
		const purchasesSheet = XLSX.utils.aoa_to_sheet(purchasesSheetData);

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
		programId: string,
		promoterId: string,
		startDate: Date,
		endDate: Date,
	) {
		this.logger.info('START: getReferralsReport service');

		const filter = {
			createdAt: Raw((alias) => `${alias} BETWEEN :start AND :end`, {
				start: startDate.toISOString(),
				end: endDate.toISOString(),
			})
		};

		const referralsResult = await this.getPromoterReferrals(programId, promoterId, undefined, undefined, true, filter) as PromoterInterfaceWorkbook;

		const referralTable = referralsResult.getReferralSheet().getReferralTable();

		const workbook = PromoterInterfaceWorkbook.toXlsx();
		const sheetData: any[] = [snakeCaseToHumanReadable(referralTable.getHeader())];

		referralTable.getRows().map(row => {
			sheetData.push(row);
		});

		const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Referrals');

		const fileBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

		this.logger.info('END: getReferralsReport service');
		return fileBuffer;
	}

	async getCommissionsReport(
		programId: string,
		promoterId: string,
		startDate: Date,
		endDate: Date,
	) {
		this.logger.info(`START: getCommissionsReport service`);

		const filter = {
			createdAt: Raw((alias) => `${alias} BETWEEN :start AND :end`, {
				start: startDate.toISOString(),
				end: endDate.toISOString(),
			})
		};

		const signUpsResult = await this.getSignUpsForPromoter(programId, promoterId, false, filter) as SignUp[];
		const purchasesResult = await this.getPurchasesForPromoter(programId, promoterId, false, filter) as Purchase[];

		const promoterResult = await this.getPromoterEntity(promoterId);

		const commissionSheetJsonWorkbook = this.commissionConverter.convertToReportWorkbook(signUpsResult, purchasesResult, promoterResult, startDate, endDate);

		// get both tables and the list
		const purchasesTable = commissionSheetJsonWorkbook.getCwPurchases().getPurchaseCommissionsTable();
		const signUpsTable = commissionSheetJsonWorkbook.getCwSignups().getSignupCommissionsTable();
		const commissionSummaryList = commissionSheetJsonWorkbook.getCwSummary().getCommissionsSummaryList();

		const workbook = CommissionWorkbook.toXlsx();

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

		// adding sheet to workbook
		XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
		XLSX.utils.book_append_sheet(workbook, purchasesSheet, 'Purchases');
		XLSX.utils.book_append_sheet(workbook, signUpsSheet, 'Signups');

		const fileBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

		this.logger.info(`END: getCommissionsReport service`);
		return fileBuffer;
	}

	async getLinksReport(
		programId: string,
		promoterId: string,
		startDate: Date,
		endDate: Date,
	) {
		this.logger.info(`START: getLinksReport service`);

		const filter = {
			createdAt: Raw((alias) => `${alias} BETWEEN :start AND :end`, {
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
				signUps: true,
				purchases: true,
				program: true,
			}
		});

		const linkSheetJsonWorkbook = this.linkConverter.convertToReportWorkbook(linksResult, startDate, endDate);

		const workbook = LinkWorkbook.toXlsx();

		// getting table and list
		const linksTable = linkSheetJsonWorkbook.getLwLinks().getLinksTable();
		const linkSummaryList = linkSheetJsonWorkbook.getLwSummary().getLinkSummaryList();

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

		XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
		XLSX.utils.book_append_sheet(workbook, linksSheet, 'Links');

		const fileBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

		this.logger.info(`END: getLinksReport service`);
		return fileBuffer;
	}

	async getPromoterStatistics(
		programId: string,
		promoterId: string,
		toUseSheetJsonFormat: boolean = true,
	) {
		this.logger.info(`START: getPromoterStatistics service`);

		// checking if the program and promoter exist
		await this.programService.getProgram(programId);
		await this.getPromoter(promoterId);

		const referralAggregateResult = await this.referralAggregateViewRepository.findOne(
			{
				where: {
					programId,
					promoterId,
				},
			},
		);

		let referralDto;
		if (!referralAggregateResult) {
			referralDto = {
				programId,
				promoterId,
				totalCommission: 0,
				totalRevenue: 0,
				totalSignUps: 0,
				totalPurchases: 0,
			};
		} else {
			referralDto = referralAggregateResult;
		}

		if (toUseSheetJsonFormat) {
			const promoterWorkbook = this.referralConverter.convertReferralAggregateViewToSheet([
				referralAggregateResult ?? {
					programId,
					promoterId,
					totalCommission: 0,
					totalRevenue: 0,
					totalSignUps: 0,
					totalPurchases: 0,
				}
			]);
			this.logger.info(`END: getPromoterStatistics service: Returning Workbook`);

			return promoterWorkbook;
		}

		this.logger.info(`END: getPromoterStatistics service`);
		return referralDto;
	}

	async getFirstPromoterReferral(promoterId: string) {
		this.logger.info(`START: getFirstPromoterReferral service`);

		await this.getPromoter(promoterId);
		const referralResult = await this.referralAggregateViewRepository.findOne(
			{ where: { promoterId } },
		);

		if (!referralResult) {
			this.logger.error(
				`Error. Failed to get first referral for Promoter ID: ${promoterId}.`,
			);
			throw new NotFoundException(
				`Error. Failed to get first referral for Promoter ID: ${promoterId}.`,
			);
		}

		this.logger.info(`END: getFirstPromoterReferral service`);
		return referralResult;
	}

	async getPromoterLinkStatistics(programId: string, promoterId: string, toUseSheetJsonFormat: boolean = true) {
		this.logger.info(`START: getPromoterLinkStatistics service`);
		const linkStatsResult = await this.linkStatsViewRepository.find({
			where: {
				programId,
				promoterId
			},
		});

		const programResult = await this.programService.getProgramEntity(programId);

		if (toUseSheetJsonFormat) {
			const promoterWorkbook = this.linkConverter.convertLinkStatsToSheet(linkStatsResult, {
				programId,
				website: programResult.website,
			});
			this.logger.info(`START: getPromoterLinkStatistics service: Returning Workbook`);
			return promoterWorkbook;
		}

		this.logger.info(`END: getPromoterLinkStatistics service`);
		return linkStatsResult;
	}

}
