import {
  BadRequestException,
  Injectable,
  // Logger,
  NotFoundException
} from '@nestjs/common';
import { CreateFunctionDto, UpdateFunctionDto } from 'src/dtos';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsRelations, DataSource } from 'typeorm';
import { QueryOptionsInterface } from '../interfaces/queryOptions.interface';
import { Condition, Function, GenerateCommissionEffect, SwitchCircleEffect } from '../entities';
import { ProgramService } from './program.service';
import { FunctionConverter } from '../converters/function.converter';
import { GENERATE_COMMISSION_EVENT, GenerateCommissionEvent, SWITCH_CIRCLE_EVENT, SwitchCircleEvent, TRIGGER_EVENT, TriggerEvent } from '../events';
import { LoggerService } from './logger.service';
import { CircleService } from './circle.service';
import { PromoterService } from './promoter.service';
import { commissionTypeEnum, conditionParameterEnum, conversionTypeEnum, effectEnum, triggerEnum, functionStatusEnum } from '../enums';
import { plainToInstance } from 'class-transformer';
import { roundedNumber } from '../utils';

@Injectable()
export class FunctionService {

  constructor(
    @InjectRepository(Function)
    private readonly functionRepository: Repository<Function>,
    @InjectRepository(Condition)
    private readonly conditionRepository: Repository<Condition>,

    private programService: ProgramService,
    private promoterService: PromoterService,
    private circleService: CircleService,

    private functionConverter: FunctionConverter,

    private eventEmitter: EventEmitter2,

    private datasource: DataSource,

    private logger: LoggerService,
  ) { }

  /**
   * Create function
   */
  async createFunction(programId: string, body: CreateFunctionDto) {
    return this.datasource.transaction(async (manager) => {
      this.logger.info('START: createFunction service');

      const programResult = await this.programService.getProgramEntity(programId);
      const circleResult = await this.circleService.getCircleEntity(body.circleId);

      if (!programResult) {
        this.logger.warn(`Failed to get Program ${programId} for createFunction`);
        throw new NotFoundException(`Failed to get Program ${programId}.`);
      }
      if (
        (body.effect instanceof SwitchCircleEffect)
        && !await this.circleService.circleExists(body.effect.targetCircleId)
      ) {
        this.logger.warn(`Circle ${body.effect.targetCircleId} does not exist.`);
        throw new NotFoundException(`Circle ${body.effect.targetCircleId} does not exist.`);
      }

      const functionRepository = manager.getRepository(Function);
      const conditionRepository = manager.getRepository(Condition);

      const conditions = body.conditions ? await Promise.all(
        body.conditions?.map(async (conditionDto) => {
          const newCondition = conditionRepository.create({
            parameter: conditionDto.condition.parameter,
            operator: conditionDto.condition.operator,
            value: String(conditionDto.condition.value), // Store as string
          });

          return conditionRepository.save(newCondition); // Ensure it's saved
        })
      ) : [];

      const newFunction = functionRepository.create({
        ...body,
        program: programResult,
        circle: circleResult,
        conditions,
      });

      const savedFunction = await functionRepository.save(newFunction);
      const functionDto = this.functionConverter.convert(savedFunction);

      this.logger.info('END: createFunction service');
      return functionDto;
    });
  }

  /**
   * Get all functions
   */
  async getAllFunctions(programId: string, queryOptions: QueryOptionsInterface = {}) {
    this.logger.info('Start getAllFunctions service');

    const whereOptions = {};

    if (queryOptions['name']) {
      whereOptions['name'] = queryOptions.name;
      delete queryOptions['name'];
    }
    if (queryOptions['conversionType']) {
      whereOptions['conversionType'] = queryOptions.conversionType;
      delete queryOptions['conversionType'];
    }
    if (queryOptions['effect']) {
      whereOptions['effect'] = queryOptions.effect;
      delete queryOptions['effect'];
    }

    const functionsResult = await this.functionRepository.find({
      where: {
        program: {
          programId
        },
        ...whereOptions
      },
      relations: {
        circle: true,
        conditions: {
          func: true
        }
      },
      ...queryOptions
    });

    if (!functionsResult || functionsResult.length === 0) {
      throw new NotFoundException(`Error. Functions of Program ${programId} not found.`);
    }

    this.logger.info('End getAllFunctions service');

    return functionsResult.map(func => this.functionConverter.convert(func));
  }

  /**
   * Get function
   */
  async getFunction(programId: string, functionId: string) {
    this.logger.info('START: getFunction service');

    const functionResult = await this.functionRepository.findOne({
      where: {
        program: { programId },
        functionId,
      },
      relations: {
        circle: true,
        conditions: {
          func: true
        }
      },
    });

    if (!functionResult) {
      throw new NotFoundException(`Error. Function ${functionId} not found.`);
    }

    const functionDto = this.functionConverter.convert(functionResult);


    this.logger.info('END: getFunction service');
    return functionDto;
  }

  /**
   * Get function
   */
  async getFunctionEntity(programId: string, functionId: string, relations?: FindOptionsRelations<Function>) {
    this.logger.info('START: getFunctionEntity service');

    const functionResult = await this.functionRepository.findOne({
      where: {
        program: { programId },
        functionId,
      },
      relations,
    });


    if (!functionResult) {
      throw new NotFoundException(`Error. Function ${functionId} not found.`);
    }

    this.logger.info('END: getFunctionEntity service');
    return functionResult;
  }

  async getRandomFunction(programId: string) {
    this.logger.info('START: getRandomFunction service');

    const functionResult = await this.functionRepository.findOne({
      where: {
        programId
      }
    });

    if (!functionResult) {
      throw new NotFoundException(`Error. Failed to get random function for Program ID: ${programId}.`);
    }

    this.logger.info('END: getRandomFunction service');
    return functionResult;
  }

  /**
   * Update function
   */
  async updateFunction(programId: string, functionId: string, body: UpdateFunctionDto) {
    return this.datasource.transaction(async (manager) => {
      this.logger.info('START: updateFunction service');

      const functionRepository = manager.getRepository(Function);
      const conditionRepository = manager.getRepository(Condition);

      if (
        (body.effect instanceof SwitchCircleEffect)
        && !await this.circleService.circleExists(body.effect.targetCircleId)
      ) {
        this.logger.warn(`Circle ${body.effect.targetCircleId} does not exist.`);
        throw new NotFoundException(`Circle ${body.effect.targetCircleId} does not exist.`);
      }

      // Fetch function with current conditions
      const functionResult = await this.getFunctionEntity(programId, functionId, { conditions: true });

      // Extract existing conditions
      const existingConditionIds = functionResult.conditions.map(c => c.conditionId);


      if (body.conditions) {
        // New conditions array for saving
        const updatedConditions: Condition[] = [];

        for (const conditionDto of body.conditions) {
          if (conditionDto.conditionId) {
            // Existing condition - update
            await conditionRepository.update(
              { conditionId: conditionDto.conditionId },
              {
                parameter: conditionDto.condition.parameter,
                operator: conditionDto.condition.operator,
                value: String(conditionDto.condition.value),
              }
            );

            updatedConditions.push({ conditionId: conditionDto.conditionId } as Condition); // Keep track of updated ones
          } else {
            // New condition - create
            const newCondition = conditionRepository.create({
              parameter: conditionDto.condition.parameter,
              operator: conditionDto.condition.operator,
              value: String(conditionDto.condition.value),
              func: functionResult,
            });

            const savedCondition = await conditionRepository.save(newCondition);
            updatedConditions.push(savedCondition);
          }
        }

        // Handle deleted conditions (remove those not in updatedConditions)
        const conditionIdsToDelete = existingConditionIds.filter(id =>
          !updatedConditions.some(cond => cond.conditionId === id)
        );

        if (conditionIdsToDelete.length > 0) {
          await conditionRepository.delete(conditionIdsToDelete);
        }

        // Remove conditions from body before updating function
        delete body.conditions;
      }

      // Update the function itself
      await functionRepository.update({ functionId }, { ...body, updatedAt: () => `NOW()` });

      this.logger.info('END: updateFunction service');
    });
  }


  /**
   * Delete function
   */
  async deleteFunction(programId: string, functionId: string) {
    this.logger.info('START: deleteFunction service');

    await this.functionRepository.delete({ functionId });

    this.logger.info('END: deleteFunction service');
  }

  @OnEvent(TRIGGER_EVENT)
  async triggerProgramFunctions(payload: TriggerEvent) {
    this.logger.info('START: triggerProgramFunctions service');

    const functionsResult = await this.functionRepository.find({
      where: {
        program: {
          programId: payload.programId
        },
      },
      relations: {
        circle: true,
        conditions: true,
      },
    });

    // function should not be triggered, if: 
    // 1. Function is inactive
    // 2. Function is not of that trigger type
    // 3. Promoter not in circle
    // 4. One of the function's conditions is false
    for (const func of functionsResult) {
      // TODO: evaluate conditions differently
      if (
        !(
          (func.status === functionStatusEnum.ACTIVE)
          && (func.trigger === payload.triggerType)
          && (await this.circleService.promoterExistsInCircle(func.circle.circleId, payload.promoterId))
          && (await this.evaluateAllConditions(func.conditions, payload))
        )
      ) {
        this.logger.info(`Function not triggered. Moving to next function.`);
        continue;
      }

      func.effect = (func.effectType === effectEnum.GENERATE_COMMISSION)
        ? plainToInstance(GenerateCommissionEffect, func.effect)
        : plainToInstance(SwitchCircleEffect, func.effect);

      this.triggerFunction(func, payload);
    }

    this.logger.info('END: triggerProgramFunctions service');
    return;
  }

  private async shouldNotTriggerFunction(func: Function, payload: TriggerEvent) {
    this.logger.info(`START: shouldNotTriggerFunction service`);

    const inactive = !(func.status === functionStatusEnum.ACTIVE);
    const promoterNotInCircle = !(await this.circleService.promoterExistsInCircle(func.circle.circleId, payload.promoterId));
    const differentTrigger = !(func.trigger === payload.triggerType);
    const anyConditionFalse = !(await this.evaluateAllConditions(func.conditions, payload));

    console.log(inactive, promoterNotInCircle, differentTrigger, anyConditionFalse);

    this.logger.info(`START: shouldNotTriggerFunction service`);
    return inactive || promoterNotInCircle || differentTrigger || anyConditionFalse;
  }

  private triggerFunction(func: Function, payload: TriggerEvent) {
    this.logger.info(`START: triggerFunction service`);

    if (func.effect instanceof SwitchCircleEffect) {

      const switchCircleEvent = new SwitchCircleEvent(
        payload.programId,
        payload.promoterId,
        func.circle.circleId,
        func.effect.targetCircleId,
      );
      this.eventEmitter.emit(SWITCH_CIRCLE_EVENT, switchCircleEvent);

    } else if (func.effect instanceof GenerateCommissionEffect) {

      // TODO: Make typescript infer that payload.amount isn't null when a generate commission event is emitted
      let commissionAmount = 0;
      if (func.effect.commission.commissionType === commissionTypeEnum.FIXED) {
        commissionAmount = func.effect.commission.commissionValue;
      } else {
        commissionAmount = roundedNumber(payload.amount! * func.effect.commission.commissionValue / 100, 2);
      }

      const generateCommissionEvent = new GenerateCommissionEvent(
        payload.contactId,
        payload.triggerType === triggerEnum.SIGNUP ? conversionTypeEnum.CONTACT : conversionTypeEnum.PURCHASE,
        payload.promoterId,
        commissionAmount,
      );
      this.eventEmitter.emit(GENERATE_COMMISSION_EVENT, generateCommissionEvent);
    }

    this.logger.info(`END: triggerFunction service`);
  }

  private async evaluateAllConditions(conditions: Condition[], payload: TriggerEvent) {
    this.logger.info(`START: evaluateAllConditions service`);

    for (const condition of conditions) {

      if (!(await this.evaluateCondition(condition, payload))) {
        this.logger.info(`END: evaluateAllConditions service: false condition encountered:\
           ${JSON.stringify(condition, null, 2)} for payload: ${JSON.stringify(payload, null, 2)}.`);
        return false;
      }
    }

    this.logger.info(`END: evaluateAllConditions service: all conditions satisfied.`);
    return true;
  }

  private async evaluateCondition(condition: Condition, payload: TriggerEvent) {
    this.logger.info(`START: evaluateCondition service`);

    let evalResult: boolean;

    // SIGNUPS condition
    if (condition.parameter === conditionParameterEnum.NUM_OF_SIGNUPS) {

      const numSignUps = (await this.promoterService.getSignUpsForPromoter(
        payload.programId,
        payload.promoterId
      )).length;

      evalResult = condition.evaluate({ numSignUps });

      // PURCHASES condition
    } else if (condition.parameter === conditionParameterEnum.NUM_OF_PURCHASES) {

      const numPurchases = (await this.promoterService.getPurchasesForPromoter(
        payload.programId,
        payload.promoterId
      )).length;


      evalResult = condition.evaluate({ numPurchases });
      console.log(payload.promoterId, numPurchases, evalResult);
      // EXTERNAL ID condition
    } else if (condition.parameter === conditionParameterEnum.EXTERNAL_ID) {

      if (!payload.externalId) {
        this.logger.warn(`Error. API payload requires external ID for this function condition.`);
        throw new BadRequestException(`Error. API payload requires external ID for this function condition.`);
      }

      evalResult = condition.evaluate({ externalId: payload.externalId });
    } else {
      evalResult = false;
    }

    this.logger.info(`END: evaluateCondition service`);
    return evalResult;
  }
}
