import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DataSource, Repository } from 'typeorm';
import { CreateCommissionDto } from '../dtos';
import { Commission } from '../entities';
import { LoggerService } from './logger.service';
import { GENERATE_COMMISSION_EVENT, GenerateCommissionEvent } from '../events';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class CommissionService {
	constructor(
		@InjectRepository(Commission)
		private readonly commissionRepository: Repository<Commission>,

		private datasource: DataSource,

		private logger: LoggerService,
	) {}

	@OnEvent(GENERATE_COMMISSION_EVENT)
	private async createCommission(payload: GenerateCommissionEvent) {
		return this.datasource.transaction(async (manager) => {
			this.logger.info(`START: createCommission service`);

			const commissionRepository = manager.getRepository(Commission);

			const createCommissionDto = new CreateCommissionDto();
			createCommissionDto.amount = payload.amount;
			createCommissionDto.contactId = payload.contactId;
			createCommissionDto.linkId = payload.linkId;
			createCommissionDto.conversionType = payload.conversionType;
			createCommissionDto.promoterId = payload.promoterId;

			if (payload.revenue) {
				createCommissionDto.revenue = payload.revenue;
			}

			const newCommission =
				commissionRepository.create(createCommissionDto);
			const savedCommission =
				await commissionRepository.save(newCommission);

			if (!savedCommission) {
				this.logger.error(`Failed to save commission.`);
				throw new InternalServerErrorException(
					'Failed to save commission.',
				);
			}

			this.logger.info(`END: createCommission service`);
			return savedCommission;
		});
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
				contact: {
					programId: programId,
				},
				promoterId,
			},
		});

		if (!commissionResult) {
			throw new BadRequestException();
		}

		this.logger.info('END: getFirstCommission service');
		return commissionResult;
	}
}
