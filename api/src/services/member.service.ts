import {
	BadRequestException,
	forwardRef,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MemberConverter } from 'src/converters/member.converter';
import { CreateMemberDto, SignUpMemberDto, UpdateMemberDto } from 'src/dtos';
import { Member, PromoterMember } from 'src/entities';
import { Repository, FindOptionsRelations, DataSource, FindOptionsWhere } from 'typeorm';
import { LoggerService } from './logger.service';
import { memberRoleEnum, statusEnum } from 'src/enums';
import { PromoterConverter } from 'src/converters/promoter.converter';
import { MemberAuthService } from './memberAuth.service';
import * as bcrypt from 'bcrypt';
import { SALT_ROUNDS } from 'src/constants';

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

		if (await this.memberExistsInAnyPromoter(body.email, programId)) {
			this.logger.error(`Error. Email ${body.email} is already part of Program ${programId}`);
			throw new BadRequestException(`Error. Email ${body.email} is already part of Program ${programId}`);
		}

		const newMember = this.memberRepository.create({
			...body,
			program: {
				programId,
			},
		});
		const savedMember = await this.memberRepository.save(newMember);

		const memberDto = this.memberConverter.convert(savedMember);

		this.logger.info('END: memberSignUp service');
		return memberDto;
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
			throw new NotFoundException(
				`Failed to get member of ID: ${memberId}.`,
			);
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
				if (await this.memberExistsInAnyPromoter(email, member.program.programId)) {
					this.logger.error(`Error. Cannot use that email as it already exists in the program!`);
					throw new BadRequestException(`Error. Cannot use that email as it already exists in the program!`);
				}

				member.email = email;
			}

			console.log(body);

			// Update other fields
			Object.assign(member, updateFields);

			await memberRepository.save(member);

			await manager
				.createQueryBuilder()
				.update(Member)
				.set({ updatedAt: () => 'NOW()' }) // Correctly updates timestamp with time zone
				.where({ memberId })
				.execute();

			console.log(member);
			const memberDto = this.memberConverter.convert(member);

			this.logger.info('END: updateMemberInfo service');
			return memberDto
		});

	}
	/**
	 * Delete member
	 */
	async deleteMember(memberId: string) {
		this.logger.info('START: deleteMember service');
		const member = await this.memberRepository.findOne({
			where: { memberId: memberId },
		});

		if (!member) {
			this.logger.error('Member does not exist');
			throw new Error(`Member does not exist.`);
		}

		await this.memberRepository.remove(member);
		this.logger.info('END: deleteMember service');
	}

	async memberExistsInAnyPromoter(email: string, programId: string) {
		this.logger.info('START: memberExistsInAnyPromoter service');
		const member = await this.memberRepository.findOne({
			where: {
				email: email,
				program: {
					programId: programId,
				},
			},
			relations: {
				program: true,
				promoterMembers: true,
			},
		});

		let exists = false;

		if (member?.promoterMembers) {
			for (const promoterMember of member.promoterMembers) {
				if (promoterMember.status === statusEnum.ACTIVE) {
					exists = true;
					break;
				}
			}
		}

		this.logger.info('END: memberExistsInAnyPromoter service');
		return exists;
	}

	async leavePromoter(memberId: string, promoterId: string) {
		this.logger.info(`START: leavePromoter service`);

		const canLeave = await this.canLeavePromoter(promoterId, memberId);
		if (!canLeave) {
			this.logger.error(`Error. Cannot leave promoter due to being the only admin in the promoter`);
			throw new BadRequestException(`Error. Cannot leave program due to being the only admin in the promoter`);
		}
		
		if (!(await this.promoterMemberRepository.findOne({ where: { promoterId, memberId, status: statusEnum.ACTIVE } }))) {
			this.logger.error(`Error. Member is already not part of this program`);
			throw new BadRequestException(`Error. Member is already not part of this program`);	
		}

		await this.promoterMemberRepository.update({ promoterId, memberId }, {
			status: statusEnum.INACTIVE
		});

		this.logger.info(`START: leavePromoter service`);
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

		if (!promoterMemberResult) {
			this.logger.error(`Error. Member ${memberId} isn't part of any promoter!`);
			throw new NotFoundException(`Error. Member ${memberId} isn't part of any promoter!`);
		}

		const acceptedTermsAndConditions = promoterMemberResult.promoter.programPromoters.find(
			programPromoter => programPromoter.programId === programId
		)!.acceptedTermsAndConditions;

		const promoterDto = this.promoterConverter.convert(promoterMemberResult.promoter, acceptedTermsAndConditions);

		this.logger.info(`END: getPromoterOfMember service`);
		return promoterDto;
	}

	private async canLeavePromoter(promoterId: string, memberId: string) {
		this.logger.info(`START: canLeavePromoter service`);

		const adminResult = await this.promoterMemberRepository.find({
			where: {
				promoterId,
				role: memberRoleEnum.ADMIN,
			}
		});

		let canLeave = true;

		if (adminResult.length > 1) {
			canLeave = true;
		}
		// at least 1 admin is present
		else if (adminResult.length === 1) {

			//user is the admin, the only admin, thus cannot leave
			if (adminResult[0].memberId === memberId) {
				canLeave = false;
			} else {
				// this user ain't the admin, can leave 
				canLeave = true;
			}
		}

		this.logger.info(`END: canLeavePromoter service`);
		return canLeave;
	}
}
