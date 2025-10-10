import {
	BadRequestException,
	forwardRef,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SignUpMemberDto, UpdateMemberDto } from 'src/dtos';
import { Member, Promoter, PromoterMember } from 'src/entities';
import { Repository, FindOptionsRelations, DataSource, FindOptionsWhere } from 'typeorm';
import { LoggerService } from './logger.service';
import { memberRoleEnum, statusEnum } from 'src/enums';
import { PromoterConverter } from 'src/converters/promoter/promoter.dto.converter';
import { MemberAuthService } from './memberAuth.service';
import * as bcrypt from 'bcrypt';
import { SALT_ROUNDS } from 'src/constants';
import { promoterStatusEnum } from '../enums/promoterStatus.enum';
import { MemberConverter } from 'src/converters/member.converter';

@Injectable()
export class MemberService {
	constructor(
		@InjectRepository(Member)
		private readonly memberRepository: Repository<Member>,

		@InjectRepository(PromoterMember)
		private readonly promoterMemberRepository: Repository<PromoterMember>,

		@Inject(forwardRef(() => MemberAuthService))
		private memberAuthService: MemberAuthService,

		private memberConverter: MemberConverter,
		private promoterConverter: PromoterConverter,

		private datasource: DataSource,

		private logger: LoggerService,
	) { }

	/**
	 * Member sign up
	 */
	async memberSignUp(programId: string, body: SignUpMemberDto) {
		this.logger.info('START: memberSignUp service');

		if (await this.memberExistsInProgram(body.email, programId)) {
			this.logger.error(`Error. Email ${body.email} is already part of Program ${programId}`);
			throw new BadRequestException(`Error. Email ${body.email} is already part of Program ${programId}`);
		}

		body.email = body.email.toLowerCase().trim();

		const newMember = this.memberRepository.create({
			...body,
			program: {
				programId,
			},
		});
		const savedMember = await this.memberRepository.save(newMember);
		const authResult = await this.memberAuthService.authenticateMember(programId, {
			email: savedMember.email.toLowerCase().trim(),
			password: body.password
		});

		this.logger.info('END: memberSignUp service');
		return authResult;
	}

	/**
	 * Get member
	 */
	async getMember(memberId: string) {
		this.logger.info('START: getMember service');

		const memberResult = await this.memberRepository.findOne({
			where: { memberId: memberId },
			relations: {
				promoterMembers: true,
			},
			select: {
				promoterMembers: true
			},
		});

		const promoterMemberResult = await this.promoterMemberRepository.findOne({ where: { memberId } });

		if (!memberResult || !promoterMemberResult) {
			this.logger.warn(`Failed to get member of ID: ${memberId}`);
			throw new NotFoundException(`Failed to get member of ID: ${memberId}.`);
		}
		const memberDto = this.memberConverter.convert(memberResult, promoterMemberResult);

		this.logger.info('END: getMember service');
		return memberDto;
	}

	/**
	 * Get member entity
	 */
	async getMemberEntity(
		memberId: string,
		relations: FindOptionsRelations<Member> = {},
	) {
		this.logger.info('START: getMemberEntity service');

		const memberResult = await this.memberRepository.findOne({
			where: { memberId },
			relations: {
				promoterMembers: true,
				...relations,
			},
			select: {
				promoterMembers: true
			},
		});

		if (!memberResult) {
			this.logger.warn(`Failed to get member of ID: ${memberId}`);
			throw new NotFoundException(
				`Failed to get member of ID: ${memberId}.`,
			);
		}

		this.logger.info('END: getMemberEntity service');
		return memberResult;
	}

	async getMemberByEmail(programId: string, email: string, whereOptions: FindOptionsWhere<Member> = {}): Promise<Member | null> {
		this.logger.info('START: getMemberByEmail service');
		const memberResult = await this.memberRepository.findOne({
			where: {
				email,
				program: {
					programId
				},
				...whereOptions,
			},
			relations: { promoterMembers: true },
		});
		this.logger.info('END: getMemberByEmail service');
		return memberResult;
	}

	/**
	 * Update member info
	 */
	async updateMemberInfo(memberId: string, body: UpdateMemberDto) {
		return this.datasource.transaction(async (manager) => {
			this.logger.info('START: updateMemberInfo service');

			const memberRepository = manager.getRepository(Member);

			const member = await memberRepository.findOne({ where: { memberId }, relations: { program: true } });

			if (!member) {
				this.logger.error(`Member does not exist: ${memberId}`);
				throw new BadRequestException(`Member does not exist.`);
			}

			const { currentPassword, newPassword, email, ...updateFields } = body;

			// If password update is attempted
			if (currentPassword || newPassword) {
				if (!currentPassword || !newPassword) {
					this.logger.error(`Error. Both the current and the new password must be provided in order to update password.`);
					throw new BadRequestException(`Error. Both the current and the new password must be provided in order to update password.`);
				}

				// Verify the current password
				const isPasswordCorrect = await this.memberAuthService.comparePasswords(currentPassword, member.password);
				if (!isPasswordCorrect) {
					this.logger.error(`Error. Incorrect password entered!`);
					throw new BadRequestException(`Error. Incorrect password entered!`);
				}

				// Hash the new password
				const salt = await bcrypt.genSalt(SALT_ROUNDS);
				member.password = await bcrypt.hash(newPassword, salt);
			}

			if (email && email !== member.email) {
				if (await this.memberExistsInProgram(email, member.program.programId)) {
					this.logger.error(`Error. Cannot use that email as it already exists in the program!`);
					throw new BadRequestException(`Error. Cannot use that email as it already exists in the program!`);
				}

				member.email = email.toLowerCase().trim();
			}

			// Update other fields
			Object.assign(member, updateFields);

			await memberRepository.save(member);

			await manager
				.createQueryBuilder()
				.update(Member)
				.set({ updatedAt: () => 'NOW()' }) // Correctly updates timestamp with time zone
				.where({ memberId })
				.execute();

			const memberDto = this.memberConverter.convert(member);

			this.logger.info('END: updateMemberInfo service');
			return memberDto
		});

	}

	/**
	 * Delete member
	 */
	async deleteMember(memberId: string) {
		return this.datasource.transaction(async (manager) => {
			this.logger.info('START: deleteMember service');

			const memberRepository = manager.getRepository(Member);
			const promoterRepository = manager.getRepository(Promoter);
			const promoterMemberRepository = manager.getRepository(PromoterMember);

			const member = await memberRepository.findOne({
				where: { memberId: memberId },
				relations: {
					promoterMembers: {
						promoter: true
					}
				}
			});

			if (!member) {
				this.logger.error(`Member ${memberId} does not exist`);
				throw new Error(`Member ${memberId} does not exist.`);
			}

			const adminResult = await promoterMemberRepository.findOne({
				where: {
					memberId,
					role: memberRoleEnum.ADMIN,
				},
				relations: {
					promoter: true
				}
			});

			let canDelete = true;

			// member isn't admin at all, can delete
			if (!adminResult) {
				canDelete = true;
			}
			else {
				const promoter = adminResult.promoter;
				const promoterAdmins = await promoterMemberRepository.find({
					where: {
						promoterId: promoter.promoterId,
						role: memberRoleEnum.ADMIN
					}
				});
				const promoterMembersResult = await promoterMemberRepository.find({
					where: {
						promoterId: promoter.promoterId
					}
				});

				// at least 1 more admin is present, can delete
				if (promoterAdmins.length > 1) {
					canDelete = true;
				}

				else if (promoterAdmins.length === 1) {
					// the only member, thus can delete safely
					if (promoterMembersResult.length === 1) {
						canDelete = true;
						promoter.status = promoterStatusEnum.ARCHIVED;

						await promoterRepository.save(promoter);
						await promoterRepository.update({ promoterId: promoter.promoterId }, {
							updatedAt: () => `NOW()`,
						});
					} else {
						// the only admin, thus cannot delete
						canDelete = false;
					}
				}

			}

			if (canDelete) {
				await memberRepository.remove(member);
			}
			this.logger.info('END: deleteMember service');
		});
	}

	async memberExistsInProgram(email: string, programId: string) {
		this.logger.info('START: memberExistsInProgram service');
		const member = await this.memberRepository.findOne({
			where: {
				email: email,
				program: {
					programId: programId,
				},
			},
			relations: {
				program: true,
				promoterMembers: {
					promoter: true
				},
			},
		});

		let exists = false;

		if (member?.promoterMembers) {
			for (const promoterMember of member.promoterMembers) {
				if (
					(promoterMember.promoter.status === promoterStatusEnum.ACTIVE) &&
					(promoterMember.status === statusEnum.ACTIVE)
				) {
					exists = true;
					break;
				}
			}
		}

		this.logger.info('END: memberExistsInProgram service');
		return exists;
	}

	async getPromoterOfMember(programId: string, memberId: string) {
		this.logger.info(`START: getPromoterOfMember service`);

		const promoterMemberResult = await this.promoterMemberRepository.findOne({
			where: {
				memberId,
			},
			relations: {
				promoter: {
					programPromoters: true
				},
			},
		});

		if (
			!promoterMemberResult ||
			(promoterMemberResult.promoter.status === promoterStatusEnum.ARCHIVED)
		) {
			this.logger.error(`Error. Member ${memberId} isn't part of any promoter!`);
			throw new NotFoundException(`Error. Member ${memberId} isn't part of any promoter!`);
		}

		const programPromoterRow = promoterMemberResult.promoter.programPromoters.find(
			programPromoter => programPromoter.programId === programId
		);

		const acceptedTermsAndConditions = programPromoterRow?.acceptedTermsAndConditions ?? false;

		const promoterDto = this.promoterConverter.convert(promoterMemberResult.promoter, acceptedTermsAndConditions);

		this.logger.info(`END: getPromoterOfMember service`);
		return promoterDto;
	}
}
