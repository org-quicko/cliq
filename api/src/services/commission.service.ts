import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CreateCommissionDto } from '../dtos';
import { Commission } from '../entities';
import { LoggerService } from './logger.service';
import { InjectRepository } from '@nestjs/typeorm';
import { WebhookService } from './webhook.service';
import { COMMISSION_CREATED, CommissionCreatedEvent } from 'src/events/CommissionCreated.event';
import { commissionEntityName } from 'src/constants';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CommissionService {
	constructor(
		@InjectRepository(Commission)
		private readonly commissionRepository: Repository<Commission>,

		private eventEmitter: EventEmitter2,

		private datasource: DataSource,

		private logger: LoggerService,
	) { }

	async createCommission(createCommissionDto: CreateCommissionDto) {
		return this.datasource.transaction(async (manager) => {
			this.logger.info(`START: createCommission service`);

			const commissionRepository = manager.getRepository(Commission);

			const newCommission = commissionRepository.create(createCommissionDto);
			const savedCommission = await commissionRepository.save(newCommission);

			const commissionResult = await commissionRepository.findOne({
				where: {
					commissionId: savedCommission.commissionId
				},
				relations: {
					contact: true
				}
			});

			if (!commissionResult) {
				this.logger.error(`Error. Failed to save commission.`);
				throw new InternalServerErrorException(`Error. Failed to save commission.`);
			}

			const commissionCreatedEvent = new CommissionCreatedEvent(
				commissionResult.contact.programId,
				'urn:org.quicko.cliq',
				{
					[commissionEntityName]: {
						"@entity": commissionEntityName,
						commissionId: commissionResult.commissionId,
						contactId: commissionResult.contactId,
						conversionType: commissionResult.conversionType,
						promoterId: commissionResult.promoterId,
						linkId: commissionResult.linkId,
						amount: commissionResult.amount,
						revenue: commissionResult.revenue,
						createdAt: commissionResult.createdAt,
						updatedAt: commissionResult.updatedAt,
					}
				},
				commissionResult.commissionId
			);

			this.eventEmitter.emit(COMMISSION_CREATED, commissionCreatedEvent);

			this.logger.info(`END: createCommission service`);
			return savedCommission;
		});
	}
}
