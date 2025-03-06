import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Link } from '../entities';
import { FindOptionsRelations, Repository } from 'typeorm';
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
    private logger: LoggerService
  ) { }

  /**
   * Create link
   */
  async createLink(programId: string, promoterId: string, body: CreateLinkDto) {
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
      name: body.name,
      source: body.source,
      medium: body.medium,
      program: {
        programId: program.programId
      },
      promoter: {
        promoterId: promoter.promoterId
      }
    });
    
    const savedLink = await this.linkRepository.save(newLink);

    this.logger.info('END: createLink service');
    return this.linkConverter.convert(savedLink);
  }

  /**
   * Get all links
   */
  async getAllLinks(programId: string, promoterId: string, queryOptions: QueryOptionsInterface = {}) {
    this.logger.info('START: getAllLinks service');
    const whereOptions = {};

    if (queryOptions['source']) {
      whereOptions['source'] = queryOptions.source;
      delete queryOptions['source'];
    }
    if (queryOptions['medium']) {
      whereOptions['medium'] = queryOptions.medium;
      delete queryOptions['medium'];
    }
    if (queryOptions['url']) {
      whereOptions['url'] = queryOptions.url;
      delete queryOptions['url'];
    }

    const links = await this.linkRepository.find({
      where: { 
        program: { 
          programId
        }, 
        promoter: { 
          promoterId 
        },
        ...whereOptions
      },
      ...queryOptions
    })

    if(!links || links.length == 0) {
      this.logger.warn('Failed to get link');
      throw new NotFoundException('Failed to get link');
    }

    this.logger.info('END: getAllLinks service');
    return links.map((link) => this.linkConverter.convert(link));
  }

  /**
   * Get link entity by ID
   */
  async getLinkEntity(linkId: string, relations?: FindOptionsRelations<Link>) {
    this.logger.info('START: getLinkEntity service');
    const linkResult = await this.linkRepository.findOne({ where: { linkId }, relations })

    if (!linkResult) {
      this.logger.warn('Failed to get link');
      throw new NotFoundException('Failed to get link');
    }

    this.logger.info('END: getLinkEntity service');
    return linkResult;
  }

  async getFirstLink(programId?: string, promoterId?: string) {
    this.logger.info('START: getRandomLink service');

    if (!programId && !promoterId) {
      throw new BadRequestException(`Error. Must provide one of Progrma ID or Promoter ID to get random link.`);
    }

    const linkResult = await this.linkRepository.findOne({ 
      where: { 
        ...(programId && { programId }),
        ...(promoterId && { promoterId })
      } 
    });

    if (!linkResult) {
      throw new NotFoundException(`Error. Failed to get random link for Program ID: ${programId} and Promoter ID: ${promoterId}.`);
    }

    this.logger.info('END: getRandomLink service');
    return linkResult;
  }

  /**
   * Get link by ID
   */
  async getLink(linkId: string) {
    this.logger.info('START: getLink service');
    const linkResult = await this.linkRepository.findOne({ where: { linkId } })

    if (!linkResult) {
      this.logger.warn(`Failed to get link ${linkId}`);
      throw new NotFoundException(`Failed to get link for link_id: ${linkId}`);
    }

    this.logger.info('END: getLink service');
    return this.linkConverter.convert(linkResult);
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
