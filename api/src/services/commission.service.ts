import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { DataSource } from "typeorm";
import { CreateCommissionDto } from "../dtos";
import { Commission } from "../entities";
import { LoggerService } from "./logger.service";
import { GENERATE_COMMISSION_EVENT, GenerateCommissionEvent } from "../events";

@Injectable()
export class CommissionService {
    constructor(

        private datasource: DataSource, 

        private logger: LoggerService,
    ) { }

    @OnEvent(GENERATE_COMMISSION_EVENT)
    private async createCommission(payload: GenerateCommissionEvent) {

        return this.datasource.transaction(async (manager) => {
            this.logger.info(`START: createCommission service`);

            const commissionRepository = manager.getRepository(Commission);

            const createCommissionDto = new CreateCommissionDto();
            createCommissionDto.amount = payload.amount;
            createCommissionDto.contactId = payload.contactId;
            createCommissionDto.conversionType = payload.conversionType;
            createCommissionDto.promoterId = payload.promoterId;
            
            const newCommission = commissionRepository.create(createCommissionDto);
            const savedCommission = await commissionRepository.save(newCommission);
            
            if(!savedCommission) {
                this.logger.error(`Failed to save commission.`);
                throw new InternalServerErrorException('Failed to save commission.');
            }
            
            this.logger.info(`END: createCommission service`);
            return savedCommission;
        })
        .then(async (result) => {
            // Ensure the refresh runs after the transaction is fully committed
            this.logger.info('Transaction committed. Refreshing materialized view...');
            await this.datasource.query(`REFRESH MATERIALIZED VIEW referral_mv;`);
            await this.datasource.query(`REFRESH MATERIALIZED VIEW referral_mv_program;`);
            return result;
          }).catch((error) => {
            if (error instanceof Error) {
              this.logger.error('Error during purchase creation:', error.message);
              throw error;
            }
          });
    }
}