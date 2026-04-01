import { WorkerHost, Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import axios, { AxiosInstance } from 'axios';
import { InternalServerErrorException } from '@nestjs/common';
import { eventQueueName } from '../constants';
import { instanceToPlain } from 'class-transformer';
import { LoggerFactory } from '@org-quicko/core';
import winston from 'winston'

export const webhookJobName = 'org-quicko-cliq-webhook-job';

@Processor(eventQueueName)
export class EventConsumer extends WorkerHost {
     private logger: winston.Logger = LoggerFactory.getLogger(EventConsumer.name);

    private client: AxiosInstance;

    constructor() {
        super();
        this.client = axios.create();
    }

    async process(job: Job) {
        
        const { url, event, signature } = job.data;

        this.logger.info(`Processing job ${job.id} for URL: ${url}`);

        switch (job.name) {
            case webhookJobName:
                try {
                    const response = await this.client.post(
                        url as string,
                        { event: instanceToPlain(event, { excludeExtraneousValues: true }) },
                        {
                            timeout: 5000,
                            headers: {
                                'x-webhook-signature': signature
                            }
                        }
                    );

                    if (response.status === 200 || response.status === 201) {
                        console.log(`Webhook sent successfully to ${url}`);
                        return;
                    }
                    
                } catch (error) {
                    console.error(`Failed to send webhook to ${url}: ${error.message}`);
                    throw error;
                }
                break;
            default:
                throw new InternalServerErrorException(`Error. Unknown job name`);
        }
    }
}
