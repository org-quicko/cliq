import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { CreateCommissionDto } from '../dtos';
import { Commission } from '../entities';
import { LoggerService } from './logger.service';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class CommissionService {
	constructor(
		@InjectRepository(Commission)
		private readonly commissionRepository: Repository<Commission>,

		private logger: LoggerService,
	) {}

	async createCommission(createCommissionDto: CreateCommissionDto) {
			this.logger.info(`START: createCommission service`);

			const newCommission = this.commissionRepository.create(createCommissionDto);
			const savedCommission = await this.commissionRepository.save(newCommission);

			if (!savedCommission) {
				this.logger.error(`Failed to save commission.`);
				throw new InternalServerErrorException(
					'Failed to save commission.',
				);
			}

			this.logger.info(`END: createCommission service`);
			return savedCommission;
	}

	async getFirstCommission(programId?: string, promoterId?: string) {
		this.logger.info('START: getFirstCommission service');

		if (!programId && !promoterId) {
			throw new BadRequestException(
				`Error. Must pass at least one of Program ID or Promoter ID to get commission result.`,
			);
		}

		const commissionResult = await this.commissionRepository.findOne({
			where: {
				...(programId && {contact: { programId }}),
				...(promoterId && { promoterId }),
			},
			relations: {
				contact: true,
			}
		});

		if (!commissionResult) {
			this.logger.warn(`No Commissions found${promoterId ? ` for Promoter ${promoterId}` : ''} in Program ${programId}`);
			throw new NotFoundException(`No Commissions found${promoterId ? ` for Promoter ${promoterId}` : ''} in Program ${programId}`);
		}

		this.logger.info('END: getFirstCommission service');
		return commissionResult;
	}

	async getPromoterCommissions(programId: string, promoterId: string) {
		const commissionsResult = await this.commissionRepository.find({
			where: {
				contact: {
					programId
				},
				promoterId
			},
			relations: {
				contact: true,
			}
		});

		if (!commissionsResult) {
			this.logger.warn(`Error. No commissions found for Promoter ${promoterId} in Program ${programId}`);
			throw new NotFoundException(`Error. No commissions found for Promoter ${promoterId} in Program ${programId}`);
		}

		return commissionsResult;
	}
}
