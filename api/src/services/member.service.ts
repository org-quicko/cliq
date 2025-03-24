import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MemberConverter } from 'src/converters/member.converter';
import { CreateMemberDto, UpdateMemberDto } from 'src/dtos';
import { Member, PromoterMember } from 'src/entities';
import { Repository, FindOptionsRelations } from 'typeorm';
import { LoggerService } from './logger.service';
import { roleEnum, statusEnum } from 'src/enums';
import { PromoterConverter } from 'src/converters/promoter.converter';

@Injectable()
export class MemberService {
	constructor(
		@InjectRepository(Member)
		private readonly memberRepository: Repository<Member>,
		
		@InjectRepository(PromoterMember)
		private readonly promoterMemberRepository: Repository<PromoterMember>,

		private memberConverter: MemberConverter,
		private promoterConverter: PromoterConverter,

		private logger: LoggerService,
	) { }

	/**
	 * Member sign up
	 */
	async memberSignUp(programId: string, member: CreateMemberDto) {
		this.logger.info('START: memberSignUp service');

		const newMember = this.memberRepository.create({
			email: member.email,
			firstName: member.firstName,
			lastName: member.lastName,
			password: member.password,
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
				promoterMembers: {
					promoterId: true,
					role: true,
					status: true,
				},
			},
		});

		if (!memberResult) {
			this.logger.warn(`Failed to get member of ID: ${memberId}`);
			throw new NotFoundException(
				`Failed to get member of ID: ${memberId}.`,
			);
		}

		this.logger.info('END: getMember service');
		return this.memberConverter.convert(memberResult);
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
			where: { memberId: memberId },
			relations: {
				promoterMembers: true,
				...relations,
			},
			select: {
				promoterMembers: {
					promoterId: true,
					role: true,
					status: true,
				},
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

	async getMemberByEmail(programId: string, email: string): Promise<Member | null> {
		this.logger.info('START: getMemberByEmail service');
		const memberResult = await this.memberRepository.findOne({
			where: { 
				email,
				program: {
					programId
				},
			},
			relations: { promoterMembers: true },
		});
		this.logger.info('END: getMemberByEmail service');
		return memberResult;
	}

	/**
	 * Update member info
	 */
	async updateMemberInfo(memberId: string, member: UpdateMemberDto) {
		this.logger.info('START: updateMemberInfo service');

		const memberResult = await this.memberRepository.findOne({
			where: { memberId: memberId },
		});

		if (!memberResult) {
			this.logger.warn(`Member does not exist: ${memberId}`);
			throw new Error(`Member does not exist.`);
		}

		await this.memberRepository.update(
			{ memberId: memberId },
			{ ...member, updatedAt: () => `NOW()` },
		);

		this.logger.info('END: updateMemberInfo service');
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

		await this.memberRepository.delete({ memberId: memberId });
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

		await this.promoterMemberRepository.update({ promoterId, memberId }, {
			status: statusEnum.INACTIVE
		});

		this.logger.info(`START: leavePromoter service`);
	}

	async getPromoterOfMember(memberId: string) {
		this.logger.info(`START: getPromoterOfMember service`);

		const promoterMemberResult = await this.promoterMemberRepository.findOne({
			where: {
				memberId,
			},
			relations: {
				promoter: true,
			},
		});

		if (!promoterMemberResult) {
			this.logger.error(`Error. Member ${memberId} isn't part of any promoter!`);
			throw new NotFoundException(`Error. Member ${memberId} isn't part of any promoter!`);
		}
		const promoterDto = this.promoterConverter.convert(promoterMemberResult.promoter);

		this.logger.info(`END: getPromoterOfMember service`);
		return promoterDto;
	}

	private async canLeavePromoter(promoterId: string, memberId: string) {
		this.logger.info(`START: canLeavePromoter service`);

		const adminResult = await this.promoterMemberRepository.find({
			where: {
				promoterId,
				role: roleEnum.ADMIN,
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
