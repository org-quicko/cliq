import { ClientException, LoggerFactory } from '@org.quicko/core';
import winston from 'winston';
import { CreatePurchase, Purchase as PurchaseBean } from '@org.quicko.cliq/core';
import { APIURL } from '../../resource';
import { RestClient } from '../RestClient';
import { CliqCredentials } from '../../beans';

export class Purchase extends RestClient {
    private logger: winston.Logger;

    constructor(config: CliqCredentials, baseUrl: string) {
        super(config, baseUrl);
        this.logger = this.getLogger()!;
    }

    async createPurchase(createPurchase: CreatePurchase): Promise<PurchaseBean> {
        try {
            this.logger.info(`START Client : ${this.constructor.name},${this.createPurchase.name}`);
            this.logger.debug(`Request`);

            const response = await super.post(APIURL.CREATE_PURCHASE, createPurchase, { });

            this.logger.debug(`Response`, response);
            this.logger.info(`END Client : ${this.constructor.name},${this.createPurchase.name}`);

            return response.data;
        } catch (error) {
            throw new ClientException('Failed to create Purchase', error);
        }
    }

    
    public getLogger() {
        if (!this.logger) {
            this.logger = LoggerFactory.getLogger("logger")!;
        }

        return this.logger;
    }

}