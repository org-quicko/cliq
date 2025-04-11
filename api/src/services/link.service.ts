import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Link } from '../entities';
import { FindOptionsRelations, Repository, FindOptionsWhere } from 'typeorm';
import { ProgramService } from './program.service';
import { PromoterService } from './promoter.service';
import { CreateLinkDto } from '../dtos';
import { LinkConverter } from '../converters/link.converter';
import { QueryOptionsInterface } from '../interfaces/queryOptions.interface';
import { LoggerService } from './logger.service';
import { defaultQueryOptions } from 'src/constants';
import { linkStatusEnum } from 'src/enums';
import { LinkStatsView } from 'src/entities/linkStats.view';

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

		const program = await this.programService.getProgram(programId);
		const promoter = await this.promoterService.getPromoter(promoterId);

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

		const linkStats = new LinkStatsView();
		linkStats.linkId = savedLink.linkId;
		linkStats.name = savedLink.name;
		linkStats.refVal = savedLink.refVal;
		linkStats.promoterId = savedLink.promoterId;
		linkStats.signups = 0;
		linkStats.purchases = 0;
		linkStats.commission = 0;
		linkStats.createdAt = savedLink.createdAt;

		const linkSheetJson = this.linkConverter.convertLinkStatsToSheet([linkStats], {
			website: program.website,
			programId,
			count: 1
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

	async getFirstLink(programId?: string, promoterId?: string) {
		this.logger.info('START: getFirstLink service');

		if (!programId && !promoterId) {
			this.logger.error(
				`Error. Must provide one of Program ID or Promoter ID to get random link.`,
			);
			throw new BadRequestException(
				`Error. Must provide one of Program ID or Promoter ID to get random link.`,
			);
		}

		const linkResult = await this.linkRepository.findOne({
			where: {
				...(programId && { programId }),
				...(promoterId && { promoterId }),
			},
		});

		if (!linkResult) {
			this.logger.warn(
				`Error. No links found for Program ID: ${programId} and Promoter ID: ${promoterId}.`,
			);
			throw new NotFoundException(
				`Error. No links found for Program ID: ${programId} and Promoter ID: ${promoterId}.`,
			);
		}

		this.logger.info('END: getFirstLink service');
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
	 * Get link by ref val
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
			throw new NotFoundException(
				`Failed to get link with ref val ${refVal}.`,
			);
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
		
		await this.linkRepository.update({ linkId }, { status: linkStatusEnum.INACTIVE });
		this.logger.info('END: deleteLink service');
	}
}
