import { ClientException, LoggerFactory, LoggingLevel } from '@org-quicko/core';
import winston from 'winston';
import { CreateSignUp, SignUp as SignUpBean } from '@org-quicko/cliq-core';
import { APIURL } from '../../resource';
import { RestClient } from '../RestClient';
import { CliqCredentials } from '../../beans';

export class SignUp extends RestClient {
    private logger: winston.Logger;

    constructor(config: CliqCredentials, baseUrl: string) {
        super(config, baseUrl);
        this.logger = LoggerFactory.createLogger('logger', LoggingLevel.info);
    }

    async createSignUp(createSignUp: CreateSignUp): Promise<SignUpBean> {
        try {
            this.logger.info(`START Client : ${this.constructor.name},${this.createSignUp.name}`);
            this.logger.debug(`Request`);

            const response = await super.post(APIURL.CREATE_SIGNUP, createSignUp, { });

            this.logger.debug(`Response`, response);
            this.logger.info(`END Client : ${this.constructor.name},${this.createSignUp.name}`);

            return response.data;
        } catch (error) {
            throw new ClientException('Failed to create SignUp', error);
        }
    }

}