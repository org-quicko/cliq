import { ClientException, LoggerFactory, LoggingLevel } from '@org-quicko/core';
import winston from 'winston';
import { CreateLink, Link as LinkBean } from '@org-quicko/cliq-core/beans';
import { ConflictException } from '@org-quicko/cliq-core/exceptions';
import { PromoterWorkbook } from '@org-quicko/cliq-sheet-core/Promoter/beans';
import { plainToInstance } from 'class-transformer';
import { APIURL } from '../../resource';
import { RestClient } from '../RestClient';
import { CliqCredentials } from '../../beans';

export class Link extends RestClient {
    private logger: winston.Logger;

    constructor(config: CliqCredentials, baseUrl: string) {
        super(config, baseUrl);
        this.logger = LoggerFactory.createLogger('logger', LoggingLevel.info);
    }

    async createLink(programId: string, promoterId: string, createLink: CreateLink): Promise<LinkBean> {
        try {
            this.logger.info(`START Client : ${this.constructor.name},${this.createLink.name}`);
            this.logger.debug(`Request`, { program_id: programId, promoter_id: promoterId });

            const response = await super.post(APIURL.CREATE_LINK, createLink, { params: [programId, promoterId] });

            this.logger.debug(`Response`, response);
            this.logger.info(`END Client : ${this.constructor.name},${this.createLink.name}`);

            return plainToInstance(LinkBean, response.data);
        } catch (error) {
            if (error instanceof Error) {
                this.logger.error("Client Error occurred", {
                    error: error.message,
                    error_type: error.name,
                    scope: "request",
                });

                // eslint-disable-next-line eqeqeq
                if (error.cause == 409) {
                    throw new ConflictException('Error: Link already exists');
                }
            }
            throw new ClientException('Failed to create Link', error);
        }
    }

    async getLinkAnalytics(programId: string, promoterId: string): Promise<PromoterWorkbook> {
        try {
            this.logger.info(`START Client : ${this.constructor.name},${this.getLinkAnalytics.name}`);
            this.logger.debug(`Request`, { program_id: programId, promoter_id: promoterId });

            const response = await super.get({
                url: APIURL.GET_LINK_ANALYTICS, params: [programId, promoterId], headers: {
                    'x-accept-type': 'application/json;format=sheet-json',
                }
            });

            this.logger.debug(`Response`, response);
            this.logger.info(`END Client : ${this.constructor.name},${this.getLinkAnalytics.name}`);

            return plainToInstance(PromoterWorkbook, response.data);
        } catch (error) {
            if (error instanceof Error) {
                this.logger.error("Client Error occurred", {
                    error: error.message,
                    error_type: error.name,
                    scope: "request",
                });                
            }
            throw new ClientException('Failed to get Link Analytics', error);
        }
    }
}