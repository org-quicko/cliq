import { Expose } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsDate, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class Webhook {

    @Expose({ name: 'webhook_id' })
    @IsUUID()
    webhookId: string;

    @Expose({ name: 'program_id' })
    @IsUUID()
    programId: string;

    @IsOptional()
    @IsString()
    secret?: string;

    @IsString()
    @IsNotEmpty()
    url: string;

    @IsArray()
    @ArrayNotEmpty()
    events: string[];

    @Expose({ name: 'created_at' })
    @IsDate()
    createdAt: Date;

    @Expose({ name: 'updated_at' })
    @IsDate()
    updatedAt: Date;
}


export class CreateWebhook {
    @IsString()
    @IsNotEmpty()
    url: string;

    @IsString()
    @IsNotEmpty()
    secret: string;

    @IsArray()
    @ArrayNotEmpty()
    events: string[];
}

export class UpdateWebhook {
    @IsOptional()
    @IsNotEmpty()
    @IsString()
    url?: string;

    @IsOptional()
    @IsNotEmpty()
    @IsString()
    secret?: string;

    @IsOptional()
    @IsArray()
    @ArrayNotEmpty()
    events?: string[];
}
