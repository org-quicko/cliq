import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PromoterWebhook } from '../entities';
import { CreatePromoterWebhookDto, UpdatePromoterWebhookDto } from '../dtos';
import { PromoterWebhookConverter } from 'src/converters/promoterWebhook.converter';
import { PromoterWebhookListConverter } from 'src/converters/promoterWebhook.list.converter';
import winston from 'winston';
import { LoggerFactory } from '@org-quicko/core';

@Injectable()
export class PromoterWebhookService {
    private logger: winston.Logger = LoggerFactory.getLogger(PromoterWebhookService.name);

    constructor(
        @InjectRepository(PromoterWebhook)
        private readonly promoterWebhookRepository: Repository<PromoterWebhook>,

        private promoterWebhookConverter: PromoterWebhookConverter,
        private promoterWebhookListConverter: PromoterWebhookListConverter,
    ) {}

    async createPromoterWebhook(
        programId: string,
        promoterId: string,
        body: CreatePromoterWebhookDto
    ) {
        this.logger.info(`START: createPromoterWebhook service`);

        // Check if any of the events already exist on another webhook
        await this.checkEventDuplicates(programId, promoterId, body.events);

        const webhook = this.promoterWebhookRepository.create({
            programId,
            promoterId,
            ...body,
        });

        const savedWebhook = await this.promoterWebhookRepository.save(webhook);
        const dto = this.promoterWebhookConverter.convert(savedWebhook);

        this.logger.info(`END: createPromoterWebhook service`);
        return dto;
    }

    async getPromoterWebhook(
        programId: string,
        promoterId: string,
        webhookId: string
    ) {
        this.logger.info(`START: getPromoterWebhook service`);

        const webhook = await this.promoterWebhookRepository.findOne({
            where: { programId, promoterId, webhookId },
        });

        if (!webhook) {
            this.logger.error(`Webhook ${webhookId} not found for program ${programId} and promoter ${promoterId}`);
            throw new BadRequestException(`Webhook not found`);
        }

        const dto = this.promoterWebhookConverter.convert(webhook);

        this.logger.info(`END: getPromoterWebhook service`);
        return dto;
    }

    async getAllPromoterWebhooks(programId: string, promoterId: string) {
        this.logger.info(`START: getAllPromoterWebhooks service`);

        const [webhooks, count] = await this.promoterWebhookRepository.findAndCount({
            where: { programId, promoterId },
        });

        const webhookList = this.promoterWebhookListConverter.convert(webhooks, 0, count, count);

        this.logger.info(`END: getAllPromoterWebhooks service`);
        return webhookList;
    }

    async updatePromoterWebhook(
        programId: string,
        promoterId: string,
        webhookId: string,
        body: UpdatePromoterWebhookDto
    ) {
        this.logger.info(`START: updatePromoterWebhook service`);

        const exists = await this.promoterWebhookExists(programId, promoterId, webhookId);

        if (!exists) {
            this.logger.error(`Webhook ${webhookId} not found`);
            throw new BadRequestException(`Webhook not found`);
        }

        if (!body.url && !body.events && !body.secret) {
            throw new BadRequestException('At least one field must be provided for update.');
        }

        if (body.events !== undefined && body.events.length === 0) {
            throw new BadRequestException('Events array cannot be empty.');
        }

        if (body.events !== undefined) {
            // Check if any of the events already exist on another webhook
            await this.checkEventDuplicates(programId, promoterId, body.events, webhookId);
        }

        await this.promoterWebhookRepository.update(
            { programId, promoterId, webhookId },
            { ...body }
        );

        this.logger.info(`END: updatePromoterWebhook service`);
    }

    async deletePromoterWebhook(
        programId: string,
        promoterId: string,
        webhookId: string
    ): Promise<void> {
        this.logger.info(`START: deletePromoterWebhook service`);

        const exists = await this.promoterWebhookExists(programId, promoterId, webhookId);

        if (!exists) {
            this.logger.error(`Webhook ${webhookId} not found`);
            throw new BadRequestException(`Webhook not found`);
        }

        await this.promoterWebhookRepository.delete({
            programId,
            promoterId,
            webhookId,
        });

        this.logger.info(`END: deletePromoterWebhook service`);
    }

    private async promoterWebhookExists(
        programId: string,
        promoterId: string,
        webhookId: string
    ): Promise<boolean> {
        const webhook = await this.promoterWebhookRepository.findOne({
            where: { programId, promoterId, webhookId },
        });

        return !!webhook;
    }

    private async checkEventDuplicates(
        programId: string,
        promoterId: string,
        events: string[],
        excludeWebhookId?: string
    ) {
        const existingWebhooks = await this.promoterWebhookRepository.find({
            where: { programId, promoterId },
        });

        for (const webhook of existingWebhooks) {
            if (excludeWebhookId && webhook.webhookId === excludeWebhookId) {
                continue; // Skip the current webhook when updating
            }

            const duplicates = webhook.events.filter(event => events.includes(event));

            if (duplicates.length > 0) {
                throw new BadRequestException(
                    `Events ${duplicates.join(', ')} are already assigned to another webhook for this promoter.`
                );
            }
        }
    }
}