import { ClientException, LoggerFactory } from '@org.quicko/core';
import winston from 'winston';
import { CreatePromoter, Promoter as PromoterBean, RegisterForProgram } from '@org.quicko.cliq/core';
import { plainToInstance } from 'class-transformer';
import { APIURL } from '../../resource';
import { RestClient } from '../RestClient';
import { CliqCredentials } from '../../beans';

export class Promoter extends RestClient {
    private logger: winston.Logger;

    constructor(config: CliqCredentials, baseUrl: string) {
        super(config, baseUrl);
        this.logger = this.getLogger()!;
    }

    async getPromoter(programId: string, promoterId: string): Promise<PromoterBean> {
        try {
            this.logger.info(`START Client : ${this.constructor.name},${this.getPromoter.name}`);
            this.logger.debug(`Request`, { program_id: programId, promoter_id: promoterId });

            const response = await super.get({ url: APIURL.GET_PROMOTER, params: [programId, promoterId] });

            this.logger.debug(`Response`, response);
            this.logger.info(`END Client : ${this.constructor.name},${this.getPromoter.name}`);

            return plainToInstance(PromoterBean, response.data);
        } catch (error) {
            if (error instanceof Error) {
                this.logger.error("Client Error occurred", {
                    error: error.message,
                    error_type: error.name,
                    scope: "request",
                });
            }
            throw new ClientException('Failed to get Promoter', error);
        }
    }

    async createPromoter(programId: string, createPromoter: CreatePromoter): Promise<PromoterBean> {
        try {
            this.logger.info(`START Client : ${this.constructor.name},${this.createPromoter.name}`);
            this.logger.debug(`Request`, { program_id: programId });

            const response = await super.post(APIURL.CREATE_PROMOTER, createPromoter, { params: [programId] });

            this.logger.debug(`Response`, response);
            this.logger.info(`END Client : ${this.constructor.name},${this.createPromoter.name}`);

            return plainToInstance(PromoterBean, response.data);
        } catch (error) {
            if (error instanceof Error) {
                this.logger.error("Client Error occurred", {
                    error: error.message,
                    error_type: error.name,
                    scope: "request",
                });
            }
            throw new ClientException('Failed to create Promoter', error);
        }
    }

    async registerPromoter(programId: string, promoterId: string, registerForProgram: RegisterForProgram): Promise<PromoterBean> {
        try {
            this.logger.info(`START Client : ${this.constructor.name},${this.registerPromoter.name}`);
            this.logger.debug(`Request`, { program_id: programId, promoter_id: promoterId });

            const response = await super.post(APIURL.REGISTER_PROMOTER_IN_PROGRAM, registerForProgram, { params: [programId, promoterId] });

            this.logger.debug(`Response`, response);
            this.logger.info(`END Client : ${this.constructor.name},${this.registerPromoter.name}`);

            return plainToInstance(PromoterBean, response.data);
        } catch (error) {
                        if (error instanceof Error) {
                this.logger.error("Client Error occurred", {
                    error: error.message,
                    error_type: error.name,
                    scope: "request",
                });
            }
            throw new ClientException('Failed to register Promoter in Program', error);
        }
    }


    public getLogger() {
        if (!this.logger) {
            this.logger = LoggerFactory.getLogger("logger")!;
        }

        return this.logger;
    }

}