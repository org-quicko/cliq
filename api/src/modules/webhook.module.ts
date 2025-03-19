import { Module } from "@nestjs/common";
import { WebhookController } from "src/controllers/webhook.controller";

@Module({
    controllers: [WebhookController],
    
})
export class WebhookModule {

}