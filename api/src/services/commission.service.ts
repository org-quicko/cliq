import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { OnEvent } from "@nestjs/event-emitter";
import { Repository } from "typeorm";
import { CreateCommissionDto } from "../dtos";
import { Commission } from "../entities";
import { LoggerService } from "./logger.service";
import { GENERATE_COMMISSION_EVENT, GenerateCommissionEvent } from "../events";

@Injectable()
export class CommissionService {
    constructor(
        @InjectRepository(Commission)
        private readonly commissionRepository: Repository<Commission>,
        private logger: LoggerService,
    ) { }

    @OnEvent(GENERATE_COMMISSION_EVENT)
    private async createCommission(payload: GenerateCommissionEvent) {
        this.logger.info(`START: createCommission service`);
        const createCommissionDto = new CreateCommissionDto();
        createCommissionDto.amount = payload.amount;
        createCommissionDto.contactId = payload.contactId;
        createCommissionDto.conversionType = payload.conversionType;
        createCommissionDto.promoterId = payload.promoterId;
        
        const newCommission = this.commissionRepository.create(createCommissionDto);
        const savedCommission = await this.commissionRepository.save(newCommission);
        
        if(!savedCommission) {
            this.logger.error(`Failed to save commission.`);
            throw new InternalServerErrorException('Failed to save commission.');
        }
        
        this.logger.info(`END: createCommission service`);
        return savedCommission;
    }
}