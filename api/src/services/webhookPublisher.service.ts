import { OnEvent } from "@nestjs/event-emitter";
import { BaseEvent, COMMISSION_CREATED, PURCHASE_CREATED, SIGNUP_CREATED } from "../events";
import { LoggerService } from "./logger.service";
import { generateSignature } from "../utils";
import { InjectQueue } from "@nestjs/bullmq";
import { eventQueueName } from "../constants";
import { Queue } from "bullmq";
import { webhookJobName } from "../queues/webhook.consumer";
import { Injectable } from "@nestjs/common";
import { Webhook } from "../entities";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Injectable()
export class WebhookPublisherService {

    constructor(
        @InjectRepository(Webhook)
        private readonly webhookRepository: Repository<Webhook>,

        @InjectQueue(eventQueueName)
        private readonly eventQueue: Queue,

        private logger: LoggerService
    ) { }

    private async getWebhooksForEvent(programId: string, event: string): Promise<Webhook[]> {
        this.logger.info(`START: getWebhooksForEvent service`);

        const webhooksResult = await this.webhookRepository
        .createQueryBuilder('webhook')
        .where('webhook.events @> :event', { event: [event] }) // @> performs array containment check
        .andWhere('webhook.program_id = :programId', { programId })
        .getMany();
        
        
        this.logger.info(`END: getWebhooksForEvent service`);
        return webhooksResult;
    }

    @OnEvent(COMMISSION_CREATED)
    @OnEvent(SIGNUP_CREATED)
    @OnEvent(PURCHASE_CREATED)
    private async handleEvent(event: BaseEvent): Promise<void> {
        this.logger.info(`START: handleEvent service`);

        // get the program's webhooks
        const webhooks = await this.getWebhooksForEvent(event.programId, event.type.split('org.quicko.cliq.')[1]);
        this.logger.info(`Dispatching event "${event.type}" to ${webhooks.length} webhook(s)`);

        for (const webhook of webhooks) {

            // event payload signature
            const signature = generateSignature(event.data, webhook.secret);

            await this.eventQueue.add(
                webhookJobName, // Job name
                { url: webhook.url, event, signature },
                {
                    attempts: 3, // Retry up to 3 times on failure.
                    backoff: { 
                        type: 'exponential', 
                        delay: 2000,
                    },
                    removeOnComplete: true, //  removes a job once it is completed
                    removeOnFail: 10, // keep the last 10 failed jobs
                },
            );
        }

        this.logger.info(`END: handleEvent service`);
    }
}