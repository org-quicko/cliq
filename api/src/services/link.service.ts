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
			refVal: body.refVal,
			program: {
				programId: program.programId,
			},
			promoter: {
				promoterId: promoter.promoterId,
			},
		});

		const savedLink = await this.linkRepository.save(newLink);

		this.logger.info('END: createLink service');
		return this.linkConverter.convert(savedLink);
	}

	/**
	 * Get all links
	 */
	async getAllLinks(
		programId: string,
		promoterId: string,
		queryOptions: QueryOptionsInterface = {},
	) {
		this.logger.info('START: getAllLinks service');
		const links = await this.linkRepository.find({
			where: {
				program: {
					programId,
				},
				promoter: {
					promoterId,
				},
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
			this.logger.error(
				`Error. Failed to get first link for Program ID: ${programId} and Promoter ID: ${promoterId}.`,
			);
			throw new NotFoundException(
				`Error. Failed to get first link for Program ID: ${programId} and Promoter ID: ${promoterId}.`,
			);
		}

		this.logger.info('END: getFirstLink service');
		return linkResult;
	}

	/**
	 * Get link by ID
	 */
	async getLink(linkId: string) {
		this.logger.info('START: getLink service');
		const linkResult = await this.linkRepository.findOne({
			where: { linkId },
		});

		if (!linkResult) {
			this.logger.warn(`Failed to get link ${linkId}`);
			throw new NotFoundException(
				`Failed to get link for link_id: ${linkId}`,
			);
		}

		this.logger.info('END: getLink service');
		return this.linkConverter.convert(linkResult);
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
	async deleteALink(linkId: string) {
		this.logger.info('START: deleteALink service');
		await this.linkRepository.delete({ linkId });
		this.logger.info('END: deleteALink service');
	}
}
