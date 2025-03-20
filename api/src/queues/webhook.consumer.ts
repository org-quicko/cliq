import { WorkerHost, Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import axios from 'axios';
import { InternalServerErrorException } from '@nestjs/common';
import { eventQueueName } from '../constants';
import { instanceToPlain } from 'class-transformer';

export const webhookJobName = 'org-quicko-cliq-webhook-job';

@Processor(eventQueueName)
export class EventConsumer extends WorkerHost {

    async process(job: Job) {
        
        const { url, event, signature } = job.data;
        
        switch (job.name) {
            case webhookJobName:
                try {
                    await axios.post(
                        url as string,
                        { event: instanceToPlain(event, { excludeExtraneousValues: true }) },
                        {
                            timeout: 5000,
                            headers: {
                                'x-webhook-signature': signature
                            }
                        }
                    );
                    console.log(`Webhook sent successfully to ${url}`);
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
