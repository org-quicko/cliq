import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PromoterMember } from '../entities';
import { FindOptionsRelations, Repository } from 'typeorm';
import { LoggerService } from './logger.service';
import { statusEnum } from 'src/enums';

@Injectable()
export class PromoterMemberService {
	constructor(
		@InjectRepository(PromoterMember)
		private promoterMemberRepository: Repository<PromoterMember>,

		private logger: LoggerService,
	) {}

	async getPromoterMemberRowEntity(promoterId: string, memberId: string, relations: FindOptionsRelations<PromoterMember> = {}) {
		this.logger.info('START: getPromoterMemberRowEntity service');

		const promoterMember = await this.promoterMemberRepository.findOne({
			where: {
				promoterId,
				memberId,
			},
			relations
		});

		if (!promoterMember) {
			this.logger.error(
				`Error. Failed to find promoterMember for Promoter ID ${promoterId} and Member ID ${memberId}.`,
			);
			throw new NotFoundException(
				`Error. Failed to find promoterMember for Promoter ID ${promoterId} and Member ID ${memberId}.`,
			);
		}

		this.logger.info('END: getPromoterMemberRowEntity service');
		return promoterMember;
	}

	async getFirstPromoterMemberRow(programId: string, promoterId: string) {
		const promoterMember = await this.promoterMemberRepository.findOne({
			where: {
				promoterId,
				promoter: {
					programPromoters: {
						programId
					}
				},
				status: statusEnum.ACTIVE
			}
		});

		if (!promoterMember) {
			this.logger.error(`Error. Promoter ${promoterId} not found in Program ${programId}`);
			throw new BadRequestException(`Error. Promoter ${promoterId} not found in Program ${programId}`);
		}

		return promoterMember;
	}
}
