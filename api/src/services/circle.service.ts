import {
	BadRequestException,
	forwardRef,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsRelations, DataSource, FindOptionsWhere } from 'typeorm';
import { AddPromoterToCircleDto, CreateCircleDto, SwitchCircleDto } from '../dtos';
import { Circle, CirclePromoter } from '../entities';
import { ProgramService } from './program.service';
import { CircleConverter } from '../converters/circle.converter';
import { PromoterConverter } from '../converters/promoter/promoter.dto.converter';
import { QueryOptionsInterface } from '../interfaces/queryOptions.interface';
import { LoggerService } from './logger.service';
import { defaultQueryOptions } from '../constants';

@Injectable()
export class CircleService {
	constructor(
		@InjectRepository(Circle)
		private readonly circleRepository: Repository<Circle>,
		@InjectRepository(CirclePromoter)
		private readonly circlePromoterRepository: Repository<CirclePromoter>,

		@Inject(forwardRef(() => ProgramService))
		private programService: ProgramService,

		private circleConverter: CircleConverter,
		private promoterConverter: PromoterConverter,

		private datasource: DataSource,

		private logger: LoggerService,
	) { }

	/**
	 * Create circle
	 */
	async createCircle(programId: string, body: CreateCircleDto) {
		this.logger.info('START: createCircle service');

		const programResult = await this.programService.getProgram(programId);

		if (!programResult) {
			this.logger.warn(
				`Failed to get Program ${programId} for creating circle.`,
			);
			throw new BadRequestException(
				`Failed to get Program ${programId} for creating circle.`,
			);
		}

		const circleEntity = this.circleRepository.create({
			name: body.name,
			isDefaultCircle: body?.isDefaultCircle,
			program: {
				programId,
			},
		});

		const savedCircle = await this.circleRepository.save(circleEntity);

		this.logger.info('END: createCircle service');
		return this.circleConverter.convert(savedCircle);
	}

	/**
	 * Get all circles
	 */
	async getAllCircles(
		programId: string,
		whereOptions: FindOptionsWhere<Circle> = {},
		queryOptions: QueryOptionsInterface = defaultQueryOptions,
	) {
		this.logger.info('START: getAllCircles service');

		const circles = await this.circleRepository.find({
			where: {
				program: {
					programId,
				},
				...whereOptions,
			},
			...queryOptions,
		});

		if (!circles) {
			this.logger.warn('Failed to get circles');
			throw new NotFoundException('Failed to get circles');
		}

		this.logger.info('END: getAllCircles service');
		return circles.map((circle: Circle) =>
			this.circleConverter.convert(circle),
		);
	}

	/**
	 * Add promoters
	 */
	async addPromoters(circleId: string, body: AddPromoterToCircleDto) {
		this.logger.info('START: addPromoter service');
		const circle = await this.circleRepository.find({
			where: {
				circleId,
			},
		});

		if (!circle) {
			this.logger.warn(
				`Failed to get Circle ${circleId} for adding promoter.`,
			);
			throw new BadRequestException(
				`Failed to get Circle ${circleId} for adding promoter.`,
			);
		}

		await Promise.all(
			body.promoters.map((id: string) => {
				const entity = this.circlePromoterRepository.create({
					circle: { circleId },
					promoter: { promoterId: id },
				});
				return this.circlePromoterRepository.save(entity);
			}),
		);
		this.logger.info('END: addPromoter service');
	}

	/**
	 * Get all Promoters
	 */
	async getAllPromoters(
		programId: string,
		circleId: string,
		whereOptions: FindOptionsWhere<Circle> = {},
		queryOptions: QueryOptionsInterface = defaultQueryOptions,
	) {
		this.logger.info('START: getAllPromoters service');

		const circlePromoters = await this.circlePromoterRepository.find({
			where: {
				circle: {
					circleId,
					programId,
				},
				...whereOptions,
			},
			relations: {
				promoter: true
			},
			...queryOptions,
		});

		if (!circlePromoters || circlePromoters.length === 0) {
			this.logger.warn(`No promoters found for Circle ${circleId}`);
			throw new NotFoundException(
				`No promoters found for Circle ${circleId}`,
			);
		}

		const promotersDto = circlePromoters.map((circlePromoter) => this.promoterConverter.convert(circlePromoter.promoter, true));

		this.logger.info('END: getAllPromoters service');
		return promotersDto;
	}

	/**
	 * Get circle
	 */
	async getCircle(circleId: string) {
		this.logger.info('START: getCircle service');
		const circle = await this.circleRepository.findOne({
			where: {
				circleId,
			},
		});

		if (!circle) {
			this.logger.warn(`Failed to get circle ${circleId}`);
			throw new NotFoundException(
				`Failed to get circle for circle_id: ${circleId}`,
			);
		}

		const circleDto = this.circleConverter.convert(circle);
		this.logger.info('END: getCircle service');
		return circleDto;
	}

	/**
	 * Get circle
	 */
	async getCircleEntity(
		circleId: string,
		relations?: FindOptionsRelations<Circle>,
	) {
		this.logger.info('START: getCircleEntity service');
		const circle = await this.circleRepository.findOne({
			where: {
				circleId,
			},
			relations,
		});

		if (!circle) {
			this.logger.warn(`Failed to get circle ${circleId}`);
			throw new NotFoundException(
				`Failed to get circle for circle_id: ${circleId}`,
			);
		}

		this.logger.info('END: getCircleEntity service');
		return circle;
	}

	async circleExists(programId: string, circleId: string) {
		this.logger.info('START: circleExists service');

		const circleResult = await this.circleRepository.findOne({
			where: {
				programId,
				circleId,
			}
		});
		const exists = circleResult !== null;

		this.logger.info('END: circleExists service');
		return exists;
	}

	/**
	 * Delete circle
	 */
	async deleteCircle(circleId: string) {
		this.logger.info('START: deleteCircle service');
		await this.circleRepository.delete({
			circleId,
		});
		this.logger.info('END: deleteCircle service');
	}

	/**
	 * Remove promoter
	 */
	async removePromoter(circleId: string, promoterId: string) {
		this.logger.info('START: removePromoter service');
		const circlePromoter = await this.circlePromoterRepository.findOne({
			where: {
				circle: {
					circleId,
				},
				promoter: {
					promoterId,
				},
			},
		});

		if (!circlePromoter) {
			this.logger.error(
				`Error. Relation between circle and promoter not found.`,
			);
			throw new BadRequestException(
				`Error. Relation between circle and promoter not found.`,
			);
		}

		await this.circlePromoterRepository.remove(circlePromoter);
		this.logger.info('END: removePromoter service');
	}

	async promoterExistsInCircle(circleId: string, promoterId: string) {
		this.logger.info('START: promoterExistsInCircle service');

		const circleResult = await this.circlePromoterRepository.findOne({
			where: {
				circle: {
					circleId,
				},
				promoter: {
					promoterId,
				},
			},
		});

		const exists = circleResult !== null;

		this.logger.info('END: promoterExistsInCircle service');
		return exists;
	}

	async switchPromoterCircle(switchCircleDto: SwitchCircleDto) {
		this.logger.info('START: switchPromoterCircle service');
		try {
			return this.datasource.transaction(async (manager) => {
				const circlePromoterRepository = manager.getRepository(CirclePromoter);

				// remove relation from old circle -> DO NOT use delete(), use remove(), the latter respects relations
				const circlePromoter = await circlePromoterRepository.findOne({
					where: {
						circle: {
							circleId: switchCircleDto.currentCircleId,
						},
						promoter: {
							promoterId: switchCircleDto.promoterId,
						},
					},
				});

				if (!circlePromoter) {
					this.logger.error(
						`Error. Relation between circle and promoter not found.`,
					);
					throw new BadRequestException(
						`Error. Relation between circle and promoter not found.`,
					);
				}

				await circlePromoterRepository.remove(circlePromoter);

				// add relation to new circle
				const newCirclePromoter = circlePromoterRepository.create({
					circle: {
						circleId: switchCircleDto.targetCircleId,
					},
					promoter: {
						promoterId: switchCircleDto.promoterId,
					},
				});

				await this.circlePromoterRepository.save(newCirclePromoter);

				this.logger.info('END: switchPromoterCircle service');
			});
		} catch (error) {
			if (error instanceof Error) {
				this.logger.error(
					`Error. Failed to switch promoter circle. Message: ${error.message}`,
				);
			}
		}
	}
}
