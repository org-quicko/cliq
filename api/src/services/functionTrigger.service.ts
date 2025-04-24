import { BadRequestException, Injectable } from "@nestjs/common";
import { LoggerService } from "./logger.service";
import { commissionTypeEnum, conditionParameterEnum, conversionTypeEnum, effectEnum, functionStatusEnum, triggerEnum } from "../enums";
import { PURCHASE_CREATED, PurchaseCreatedEvent, SIGNUP_CREATED, SignUpCreatedEvent, TriggerEvent } from "../events";
import { OnEvent } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Condition, Function, GenerateCommissionEffect, Purchase, SignUp, SwitchCircleEffect } from "../entities";
import { PromoterService } from "./promoter.service";
import { CircleService } from "./circle.service";
import { CommissionService } from "./commission.service";
import { plainToInstance } from "class-transformer";
import { CreateCommissionDto, SwitchCircleDto } from "../dtos";
import { roundedNumber } from "../utils";


@Injectable()
export class FunctionTriggerService {
    constructor(
        @InjectRepository(Function)
        private readonly functionRepository: Repository<Function>,

        private promoterService: PromoterService,
        private circleService: CircleService,
        private commissionService: CommissionService,

        private logger: LoggerService
    ) { }

    @OnEvent(SIGNUP_CREATED)
    @OnEvent(PURCHASE_CREATED)
    private async triggerProgramFunctions(event: TriggerEvent) {
        this.logger.info('START: triggerProgramFunctions service');

        const functionsResult = await this.functionRepository.find({
            where: {
                program: {
                    programId: event.programId,
                },
            },
            relations: {
                circle: true,
                conditions: true,
            },
        });

        const eventEntityPayload = Object.values(event.data)[0];

        // function should not be triggered, if:
        // 1. Function is inactive
        // 2. Function is not of that trigger type
        // 3. Promoter not in circle
        // 4. One of the function's conditions is false
        for (const func of functionsResult) {
            if (
                !(
                    func.status === functionStatusEnum.ACTIVE &&
                    func.trigger === eventEntityPayload.triggerType &&
                    (await this.circleService.promoterExistsInCircle(
                        func.circle.circleId,
                        eventEntityPayload.promoterId,
                    )) &&
                    (await this.evaluateAllConditions(func.conditions, event))
                )
            ) {
                this.logger.info(`Function not triggered. Moving to next function.`);
                continue;
            }

            func.effect =
                func.effectType === effectEnum.GENERATE_COMMISSION
                    ? plainToInstance(GenerateCommissionEffect, func.effect)
                    : plainToInstance(SwitchCircleEffect, func.effect);

            await this.triggerFunction(func, event);
        }

        this.logger.info('END: triggerProgramFunctions service');
        return;
    }

    private async triggerFunction(func: Function, event: TriggerEvent) {
        this.logger.info(`START: triggerFunction service`);

        const eventEntityPayload = Object.values(event.data)[0];

        if (func.effect instanceof SwitchCircleEffect) {

            const switchCircleDto = new SwitchCircleDto();
            switchCircleDto.currentCircleId = func.circle.circleId;
            switchCircleDto.targetCircleId = func.effect.targetCircleId;
            switchCircleDto.programId = event.programId;
            switchCircleDto.promoterId = eventEntityPayload.promoterId;

            await this.circleService.switchPromoterCircle(switchCircleDto);

        } else if (func.effect instanceof GenerateCommissionEffect) {
            let commissionAmount = 0;


            const revenue: number = eventEntityPayload.amount ?? 0;
            const conversionType = eventEntityPayload.triggerType === triggerEnum.SIGNUP
                ? conversionTypeEnum.SIGNUP
                : conversionTypeEnum.PURCHASE;

            if (func.effect.commission.commissionType === commissionTypeEnum.FIXED) {
                commissionAmount = func.effect.commission.commissionValue;
            } else {
                commissionAmount = roundedNumber((revenue * func.effect.commission.commissionValue) / 100, 2);
            }

            const createCommissionDto = new CreateCommissionDto();

            createCommissionDto.contactId = eventEntityPayload.contactId;
            createCommissionDto.conversionType = conversionType;
            createCommissionDto.promoterId = eventEntityPayload.promoterId;
            createCommissionDto.linkId = eventEntityPayload.linkId;
            createCommissionDto.revenue = revenue;
            createCommissionDto.amount = commissionAmount;
            
            if (event instanceof PurchaseCreatedEvent) {
                createCommissionDto.externalId = event.purchaseId!;
                
            } else if (event instanceof SignUpCreatedEvent) {
                createCommissionDto.externalId = event.signUpId!;
            }

            await this.commissionService.createCommission(createCommissionDto);
        }

        this.logger.info(`END: triggerFunction service`);
    }

    private async evaluateAllConditions(
        conditions: Condition[],
        event: TriggerEvent,
    ) {
        this.logger.info(`START: evaluateAllConditions service`);

        for (const condition of conditions) {
            if (!(await this.evaluateCondition(condition, event))) {
                this.logger.info(`END: evaluateAllConditions service: false condition encountered:\
               ${JSON.stringify(condition, null, 2)} for event: ${JSON.stringify(event, null, 2)}.`);
                return false;
            }
        }

        this.logger.info(`END: evaluateAllConditions service: all conditions satisfied.`);
        return true;
    }

    private async evaluateCondition(
        condition: Condition,
        event: TriggerEvent,
    ) {
        this.logger.info(`START: evaluateCondition service`);

        let evalResult: boolean;

        const eventEntityPayload = Object.values(event.data)[0];

        // SIGNUPS condition
        if (condition.parameter === conditionParameterEnum.NUM_OF_SIGNUPS) {
            const signUps = await this.promoterService.getSignUpsForPromoter(
                event.programId,
                eventEntityPayload.promoterId,
                false,
            ) as SignUp[];

            const numSignUps = signUps.length;

            evalResult = condition.evaluate({ numSignUps });

            // PURCHASES condition
        } else if (
            condition.parameter === conditionParameterEnum.NUM_OF_PURCHASES
        ) {
            const numPurchases = (
                await this.promoterService.getPurchasesForPromoter(
                    event.programId,
                    eventEntityPayload.promoterId,
                    false,
                ) as Purchase[]
            ).length;

            evalResult = condition.evaluate({ numPurchases });
            // ITEM ID condition
        } else if (condition.parameter === conditionParameterEnum.ITEM_ID) {
            if (!eventEntityPayload.itemId) {
                this.logger.warn(`Error. API event requires item ID for this function condition.`);
                throw new BadRequestException(`Error. API event requires item ID for this function condition.`);
            }

            evalResult = condition.evaluate({ itemId: eventEntityPayload.itemId });
        } else {
            evalResult = false;
        }

        this.logger.info(`END: evaluateCondition service`);
        return evalResult;
    }
}