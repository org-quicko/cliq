import {
	BadRequestException,
	ConflictException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Link } from '../entities';
import { FindOptionsRelations, Repository, FindOptionsWhere } from 'typeorm';
import { ProgramService } from './program.service';
import { PromoterService } from './promoter.service';
import { CreateLinkDto } from '../dtos';
import { QueryOptionsInterface } from '../interfaces/queryOptions.interface';
import { LoggerService } from './logger.service';
import { defaultQueryOptions } from '../constants';
import { linkStatusEnum } from '../enums';
import { LinkAnalyticsView } from '../entities/linkAnalytics.view';
import { LinkConverter } from '../converters/link/link.dto.converter';
import { PromoterWorkbookConverter } from 'src/converters/promoter/promoter.workbook.converter';

@Injectable()
export class LinkService {
	constructor(
		@InjectRepository(Link)
		private readonly linkRepository: Repository<Link>,

		private programService: ProgramService,
		private promoterService: PromoterService,
		private linkConverter: LinkConverter,
		private logger: LoggerService,
	) {}

	/**
	 * Create link
	 */
	async createLink(
		programId: string,
		promoterId: string,
		body: CreateLinkDto,
	) {
		this.logger.info('START: createLink service');

		await this.promoterService.hasAcceptedTermsAndConditions(programId, promoterId);

		if (!(await this.linkExists(body.refVal, programId))) {
			this.logger.error(`Link with ref value ${body.refVal} already exists in this program!`);
			throw new ConflictException(`Link with ref value ${body.refVal} already exists in this program!`);
		}

		const program = await this.programService.getProgram(programId);
		const promoter = await this.promoterService.getPromoter(programId, promoterId);

		if (!program) {
			this.logger.warn('Failed to find program');
			throw new NotFoundException('Failed to find program');
		}
		if (!promoter) {
			this.logger.warn('Failed to get promoter');
			throw new NotFoundException('Failed to get promoter');
		}

		const newLink = this.linkRepository.create({
			...body,
			program: {
				programId: program.programId,
			},
			promoter: {
				promoterId: promoter.promoterId,
			},
		});

		const savedLink = await this.linkRepository.save(newLink);

		const linkStats = new LinkAnalyticsView();
		linkStats.linkId = savedLink.linkId;
		linkStats.name = savedLink.name;
		linkStats.refVal = savedLink.refVal;
		linkStats.promoterId = savedLink.promoterId;
		linkStats.signups = 0;
		linkStats.purchases = 0;
		linkStats.commission = 0;
		linkStats.createdAt = savedLink.createdAt;

		const promoterWorkbookConverter = new PromoterWorkbookConverter();
		const linkSheetJson = promoterWorkbookConverter.convertTo({
			linkAnalyticsInput: {
				linkAnalytics: [linkStats],
				metadata: {
					website: program.website,
					programId,
					count: 1
				}
			}
		});

		this.logger.info('END: createLink service');
		return linkSheetJson;
	}

	/**
	 * Get all links
	 */
	async getAllLinks(
		programId: string,
		promoterId: string,
		whereOptions: FindOptionsWhere<Link> = {},
		queryOptions: QueryOptionsInterface = defaultQueryOptions,
	) {
		this.logger.info('START: getAllLinks service');

		await this.promoterService.hasAcceptedTermsAndConditions(programId, promoterId);

		const links = await this.linkRepository.find({
			where: {
				program: {
					programId,
				},
				promoter: {
					promoterId,
				},
				status: linkStatusEnum.ACTIVE,
				...whereOptions,
			},
			...queryOptions,
		});

		if (!links || links.length == 0) {
			this.logger.warn('Failed to get link');
			throw new NotFoundException('Failed to get link');
		}

		this.logger.info('END: getAllLinks service');
		return links.map((link) => this.linkConverter.convert(link));
	}

	/**
	 * Get link entity by ID
	 */
	async getLinkEntity(
		linkId: string,
		relations?: FindOptionsRelations<Link>,
	) {
		this.logger.info('START: getLinkEntity service');

		const linkResult = await this.linkRepository.findOne({
			where: { linkId },
			relations,
		});

		if (!linkResult) {
			this.logger.warn('Failed to get link');
			throw new NotFoundException('Failed to get link');
		}

		this.logger.info('END: getLinkEntity service');
		return linkResult;
	}

	/**
	 * Get link by ID
	 */
	async getLink(programId: string, promoterId: string, linkId: string) {
		this.logger.info('START: getLink service');

		await this.promoterService.hasAcceptedTermsAndConditions(programId, promoterId);

		const linkResult = await this.linkRepository.findOne({
			where: { linkId },
		});

		if (!linkResult) {
			this.logger.warn(`Failed to get link ${linkId}`);
			throw new NotFoundException(
				`Failed to get link for link_id: ${linkId}`,
			);
		}
		const linkDto = this.linkConverter.convert(linkResult);
		
		this.logger.info('END: getLink service');
		return linkDto;
	}

	/**
	 * Get link entity by ref val
	 */
	async getLinkEntityByRefVal(refVal: string, programId: string, whereOptions: FindOptionsWhere<Link> = {}) {
		this.logger.info('START: getLinkByRefVal service');
		const linkResult = await this.linkRepository.findOne({
			where: {
				refVal,
				programId,
				...whereOptions
			},
			relations: {
				program: true,
				promoter: true,
			},
		});

		if (!linkResult) {
			this.logger.warn(`Failed to get link with ref val ${refVal}.`);
			throw new NotFoundException(`Failed to get link with ref val ${refVal}.`);
		}

		this.logger.info('END: getLinkByRefVal service');
		return linkResult;
	}

	/**
	 * Delete a link
	 */
	async deleteLink(programId: string, promoterId: string, linkId: string) {
		this.logger.info('START: deleteLink service');
		
		await this.promoterService.hasAcceptedTermsAndConditions(programId, promoterId);
		
		await this.linkRepository.update({ linkId }, { status: linkStatusEnum.ARCHIVED });
		this.logger.info('END: deleteLink service');
	}

	async linkExists(refVal: string, programId: string) {
		this.logger.info('START: linkExists service');

		const linkResult = await this.linkRepository.findOne({
			where: {
				refVal,
				programId,
			}
		});

		const exists = (linkResult === undefined) || (linkResult === null);

		this.logger.info('END: linkExists service');
		return exists;
	}
}
