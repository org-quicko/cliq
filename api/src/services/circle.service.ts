import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { Repository, FindOptionsRelations, DataSource } from 'typeorm';
import { AddPromoterToCircleDto, CreateCircleDto } from '../dtos';
import { Circle, CirclePromoter } from '../entities';
import { ProgramService } from './program.service';
import { CircleConverter } from '../converters/circle.converter';
import { PromoterConverter } from '../converters/promoter.converter';
import { QueryOptionsInterface } from '../interfaces/queryOptions.interface';
import { LoggerService } from './logger.service';
import { GENERATE_DEFAULT_CIRCLE_EVENT, GenerateDefaultCircleEvent, SWITCH_CIRCLE_EVENT, SwitchCircleEvent } from '../events';

@Injectable()
export class CircleService {

  constructor(
    @InjectRepository(Circle)
    private readonly circleRepository: Repository<Circle>,
    @InjectRepository(CirclePromoter)
    private readonly circlePromoterRepository: Repository<CirclePromoter>,
    private programService: ProgramService,

    private circleConverter: CircleConverter,
    private promoterConverter: PromoterConverter,

    private datasource: DataSource,

    private logger: LoggerService,
  ) { }

  @OnEvent(GENERATE_DEFAULT_CIRCLE_EVENT)
  async generateDefaultCircle(payload: GenerateDefaultCircleEvent) {
    this.logger.info('START: generateDefaultCircle service');

    await this.createCircle(payload.programId, { name: 'DEFAULT_CIRCLE', isDefaultCircle: true } as CreateCircleDto);

    this.logger.info('END: generateDefaultCircle service');
  }

  /**
   * Create circle
   */
  async createCircle(programId: string, body: CreateCircleDto) {
    this.logger.info('START: createCircle service');

    const programResult = await this.programService.getProgram(programId);

    if (!programResult) {
      this.logger.warn('Failed to get program for createCircle')
      throw new NotFoundException(`Failed to get Program ${programId}.`);
    }

    const circleEntity = this.circleRepository.create({
      name: body.name,
      isDefaultCircle: body?.isDefaultCircle,
      program: {
        programId
      }
    });

    const savedCircle = await this.circleRepository.save(circleEntity);

    this.logger.info('END: createCircle service');
    return this.circleConverter.convert(savedCircle);
  }

  /**
   * Get all circles
   */
  async getAllCircles(programId: string, queryOptions: QueryOptionsInterface = {}) {
    this.logger.info('START: getAllCircles service');
    const whereOptions = {};
    if (queryOptions['name']) {
      whereOptions['name'] = queryOptions.name;
      delete queryOptions['name'];
    }

    const circles = await this.circleRepository.find({
      where: {
        program: {
          programId
        },
        ...whereOptions
      },
      select: {
        circleId: true,
        isDefaultCircle: true,
        name: true,
        createdAt: true
      },
      ...queryOptions
    })

    if (!circles || circles.length == 0) {
      this.logger.warn('Failed to get circles');
      throw new NotFoundException('Failed to get circles')
    }

    this.logger.info('END: getAllCircles service');
    return circles.map((circle: Circle) => this.circleConverter.convert(circle));
  }

  /**
   * Add promoters
  */
  async addPromoters(circleId: string, body: AddPromoterToCircleDto) {
    this.logger.info('START: addPromoter service');
    const circle = await this.circleRepository.find({
      where: {
        circleId
      }
    })

    if (!circle) {
      this.logger.warn(`Failed to get circle ${circleId}`)
      throw new NotFoundException(`Failed to get circle for circle_id: ${circleId}`)
    }

    await Promise.all(
      body.promoters.map((id: string) => {
        const entity = this.circlePromoterRepository.create({
          circle: { circleId },
          promoter: { promoterId: id }
        });
        return this.circlePromoterRepository.save(entity);
      })
    );
    this.logger.info('END: addPromoter service');
  }

  /**
   * Get all Promoters
   */
  async getAllPromoters(circleId: string, queryOptions: QueryOptionsInterface = {}) {
    this.logger.info('START: getAllPromoters service');
    const whereOptions = {};
    if (queryOptions['name']) {
      whereOptions['name'] = queryOptions.name;
      delete queryOptions['name'];
    }

    const promoters = await this.circlePromoterRepository.find({
      where: {
        circle: {
          circleId
        },
        ...whereOptions
      },
      relations: {
        promoter: true
      },
      select: {
        promoter: {
          name: true,
          promoterId: true,
          createdAt: true,
          updatedAt: true
        }
      },
      ...queryOptions
    })

    if (!promoters) {
      this.logger.warn(`Failed to get promoters for circle ${circleId}`);
      throw new NotFoundException(`Failed to get promoters for circle_id: ${circleId}`)
    }

    this.logger.info('END: getAllPromoters service');
    return promoters.map((value) => this.promoterConverter.convert(value.promoter))
  }

  /**
   * Get circle
   */
  async getCircle(circleId: string) {
    this.logger.info('START: getCircle service');
    const circle = await this.circleRepository.findOne({
      where: {
        circleId
      }
    })

    if (!circle) {
      this.logger.warn(`Failed to get circle ${circleId}`);
      throw new NotFoundException(`Failed to get circle for circle_id: ${circleId}`)
    }

    const circleDto = this.circleConverter.convert(circle);
    this.logger.info('END: getCircle service');
    return circleDto;
  }

  async getRandomCircle(programId: string) {
    this.logger.info('START: getRandomCircle service');

    const circleResult = await this.circleRepository.findOne({ 
      where: { 
        programId
      } 
    });

    if (!circleResult) {
      throw new NotFoundException(`Error. Failed to get random circle for Program ID: ${programId}.`);
    }

    this.logger.info('END: getRandomCircle service');
    return circleResult;
  }


  /**
   * Get circle
   */
  async getCircleEntity(circleId: string, relations?: FindOptionsRelations<Circle>) {
    this.logger.info('START: getCircleEntity service');
    const circle = await this.circleRepository.findOne({
      where: {
        circleId
      },
      relations,
    })

    if (!circle) {
      this.logger.warn(`Failed to get circle ${circleId}`);
      throw new NotFoundException(`Failed to get circle for circle_id: ${circleId}`)
    }

    this.logger.info('END: getCircleEntity service');
    return circle;
  }

  async circleExists(circleId: string) {
    return await this.circleRepository.findOne({ where: { circleId } });
  }

  /**
   * Delete circle
   */
  async deleteCircle(circleId: string) {
    this.logger.info('START: deleteCircle service');
    await this.circleRepository.delete({
      circleId
    })
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
          circleId
        },
        promoter: {
          promoterId
        }
      }
    });

    if (!circlePromoter) {
      this.logger.error(`Error. Relation between circle and promoter not found.`);
      throw new BadRequestException(`Error. Relation between circle and promoter not found.`);
    }

    await this.circlePromoterRepository.remove(circlePromoter);
    this.logger.info('END: removePromoter service');
  }

  async promoterExistsInCircle(circleId: string, promoterId: string) {
    this.logger.info('START: promoterExistsInCircle service');

    const circleResult = await this.circlePromoterRepository.findOne({
      where: {
        circle: {
          circleId
        },
        promoter: {
          promoterId
        }
      }
    });

    const exists = circleResult !== null;

    this.logger.info('END: promoterExistsInCircle service');
    return exists;
  }

  @OnEvent(SWITCH_CIRCLE_EVENT)
  private async switchPromoterCircle(payload: SwitchCircleEvent) {
    this.logger.info('START: switchPromoterCircle service');
    try {
      return this.datasource.transaction(async (manager) => {

        const circlePromoterRepository = manager.getRepository(CirclePromoter);

        // remove relation from old circle -> DO NOT use delete(), use remove(), the latter respects relations
        const circlePromoter = await circlePromoterRepository.findOne({
          where: {
            circle: {
              circleId: payload.currentCircleId,
            },
            promoter: {
              promoterId: payload.promoterId,
            }
          }
        });

        if (!circlePromoter) {
          this.logger.error(`Error. Relation between circle and promoter not found.`);
          throw new BadRequestException(`Error. Relation between circle and promoter not found.`);
        }

        await circlePromoterRepository.remove(circlePromoter);

        // add relation to new circle
        const newCirclePromoter = this.circlePromoterRepository.create({ 
          circle: {
            circleId: payload.targetCircleId
          },
          promoter: {
            promoterId: payload.promoterId
          }
        });

        await this.circlePromoterRepository.save(newCirclePromoter);

        this.logger.info('END: switchPromoterCircle service');
      });
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error. Failed to switch promoter circle. Message: ${error.message}`);
      }
    }
  }
}
