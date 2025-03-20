import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoggerService } from './logger.service';
import { Webhook } from '../entities';
import { CreateWebhookDto, UpdateWebhookDto } from '../dtos';
import { WebhookConverter } from 'src/converters/webhook.converter';

@Injectable()
export class WebhookService {
    constructor(
        @InjectRepository(Webhook)
        private readonly webhookRepository: Repository<Webhook>,

        private webhookConverter: WebhookConverter,

        private logger: LoggerService,
    ) { }

    async createWebhook(programId: string, body: CreateWebhookDto) {
        this.logger.info(`START: createWebhook service`);

        const webhook = this.webhookRepository.create({
            programId,
            ...body
        });

        const savedWebhook = await this.webhookRepository.save(webhook);
        const webhookDto = this.webhookConverter.convert(savedWebhook);

        this.logger.info(`END: createWebhook service`);
        return webhookDto;
    }

    async getWebhook(programId: string, webhookId: string) {
        this.logger.info(`START: getWebhook service`);

        const webhookResult = await this.webhookRepository.findOne({
            where: { programId, webhookId },
        });

        if (!webhookResult) {
            this.logger.error(`Error. Failed to find Webhook ${webhookId} in Program ${programId}`);
            throw new BadRequestException(`Error. Failed to find Webhook ${webhookId} in Program ${programId}`);
        }

        const webhookDto = this.webhookConverter.convert(webhookResult);

        this.logger.info(`END: getWebhook service`);
        return webhookDto;
    }

    async getAllWebhooks(programId: string) {
        this.logger.info(`START: getAllWebhooks service`);

        const webhooks = await this.webhookRepository.find({
            where: { programId },
        });

        const webhooksDto = webhooks.map((webhook) => this.webhookConverter.convert(webhook));

        this.logger.info(`END: getAllWebhooks service`);
        return webhooksDto;
    }

    async updateWebhook(programId: string, webhookId: string, body: UpdateWebhookDto) {
        this.logger.info(`START: updateWebhook service`);

        if (!await this.webhookExistsInProgram(programId, webhookId)) {
            this.logger.error(`Error. Failed to find Webhook ${webhookId} in Program ${programId}`);
            throw new BadRequestException(`Error. Failed to find Webhook ${webhookId} in Program ${programId}`);
        }

        if (!body.url && !body.events && !body.secret) {
            throw new BadRequestException('At least one field (url or events) must be provided for update.');
        }

        if (body.events !== undefined) {
            if (body.events.length === 0) {
                throw new BadRequestException('Events array cannot be empty.');
            }
        }

        await this.webhookRepository.update({ webhookId }, { ...body });
        this.logger.info(`END: updateWebhook service`);

    }

    async deleteWebhook(programId: string, webhookId: string): Promise<void> {
        this.logger.info(`START: deleteWebhook service`);

        if (!await this.webhookExistsInProgram(programId, webhookId)) {
            this.logger.error(`Error. Failed to find Webhook ${webhookId} in Program ${programId}`);
            throw new BadRequestException(`Error. Failed to find Webhook ${webhookId} in Program ${programId}`);
        }

        await this.webhookRepository.delete({ programId, webhookId });

        this.logger.info(`END: deleteWebhook service`);
    }

    private async webhookExistsInProgram(programId: string, webhookId: string) {
        const webhookResult = await this.webhookRepository.findOne({
            where: { programId, webhookId },
        });

        if (!webhookResult) return false;
        else return true;
    }

    async getFirstWebhook(programId: string) {
        this.logger.info(`START: getFirstWebhook service`);

        const webhookResult = await this.webhookRepository.findOne({ where: { programId } });

        if (!webhookResult) {
            this.logger.error(`Error. Failed to find Webhook for Program ${programId}.`);
            throw new NotFoundException(`Error. Failed to find Webhook for Program ${programId}.`);
        }

        this.logger.info(`END: getFirstWebhook service`);
        return webhookResult;
    }
}
