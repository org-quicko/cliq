import { OnEvent } from "@nestjs/event-emitter";
import { BaseEvent, COMMISSION_CREATED, PURCHASE_CREATED, SIGNUP_CREATED } from "../events";
import { generateSignature } from "../utils";
import { InjectQueue } from "@nestjs/bullmq";
import { eventQueueName } from "../constants";
import { Queue } from "bullmq";
import { webhookJobName } from "../queues/webhook.consumer";
import { Injectable } from "@nestjs/common";
import { PromoterWebhook } from "../entities";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import winston from 'winston';
import { LoggerFactory } from "@org-quicko/core";

@Injectable()
export class PromoterWebhookPublisherService {
    private logger: winston.Logger = LoggerFactory.getLogger(PromoterWebhookPublisherService.name);

    constructor(
        @InjectRepository(PromoterWebhook)
        private readonly promoterWebhookRepository: Repository<PromoterWebhook>,

        @InjectQueue(eventQueueName)
        private readonly eventQueue: Queue,
    ) { }

    private async getPromoterWebhooksForEvent(
        programId: string,
        promoterId: string,
        event: string
    ): Promise<PromoterWebhook[]> {
        this.logger.info(`START: getPromoterWebhooksForEvent service`);

        const webhooksResult = await this.promoterWebhookRepository
            .createQueryBuilder('promoter_webhook')
            .where('promoter_webhook.events @> :event', { event: [event] }) 
            .andWhere('promoter_webhook.program_id = :programId', { programId })
            .andWhere('promoter_webhook.promoter_id = :promoterId', { promoterId })
            .getMany();

        this.logger.info(`END: getPromoterWebhooksForEvent service`);
        return webhooksResult;
    }

    @OnEvent(COMMISSION_CREATED)
    @OnEvent(SIGNUP_CREATED)
    @OnEvent(PURCHASE_CREATED)
    private async handleEvent(event: BaseEvent): Promise<void> {
        this.logger.info(`START: handleEvent service [Promoter Webhooks]`);

        if (!event.promoterId) {
            this.logger.info(`No promoterId in event, skipping promoter webhook dispatch`);
            return;
        }

        const webhooks = await this.getPromoterWebhooksForEvent(
            event.programId,
            event.promoterId,
            event.type.split('org.quicko.cliq.')[1]
        );

        

        this.logger.info(`Dispatching event "${event.type}" to ${webhooks.length} promoter webhook(s)`);

        for (const webhook of webhooks) {

            const signature = generateSignature(event.data, webhook.secret);

            await this.eventQueue.add(
                webhookJobName,
                { url: webhook.url, event, signature },
                {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 2000,
                    },
                    removeOnComplete: true,
                    removeOnFail: 10,
                },
            );
        }

        this.logger.info(`END: handleEvent service [Promoter Webhooks]`);
    }
}