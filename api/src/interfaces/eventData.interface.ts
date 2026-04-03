import { Expose } from "class-transformer";
import { IsString, IsOptional, IsNumber, IsDate, IsEnum, IsObject } from "class-validator";
import { triggerEnum } from "../enums";
import { conversionTypeEnum } from '../enums/conversionType.enum';

export class TriggerEventData {
    @Expose({ name: '@entity' })
    "@entity": string;

    @Expose({ name: 'trigger_type' })
    @IsEnum(triggerEnum)
    triggerType: triggerEnum;

    @Expose({ name: 'conversion_type' })
    @IsOptional()
    @IsEnum(conversionTypeEnum)
    conversionType?: conversionTypeEnum;

    @Expose({ name: 'contact_id' })
    @IsString()
    contactId: string;

    @Expose({ name: 'promoter_id' })
    @IsString()
    promoterId: string;

    @Expose({ name: 'commission_id' })
    @IsOptional()
    @IsString()
    commissionId?: string;

    @Expose({ name: 'link_id' })
    @IsString()
    linkId: string;

    @Expose({ name: 'item_id' })
    @IsOptional()
    @IsString()
    itemId?: string;

    @Expose({ name: 'amount' })
    @IsOptional()
    @IsNumber()
    amount?: number;

    @Expose({ name: 'revenue' })
    @IsOptional()
    @IsNumber()
    revenue?: number;

    @Expose({ name: 'created_at' })
    @IsDate()
    createdAt: Date;

    @Expose({ name: 'updated_at' })
    @IsDate()
    updatedAt: Date;

    @Expose({ name: 'utm_params' })
    @IsOptional()
    @IsObject()
    utmParams?: object;
};

export class SignUpCreatedEventData extends TriggerEventData {


};

export class PurchaseCreatedEventData extends TriggerEventData {

};

export class CommissionCreatedEventData {
    @Expose({ name: '@entity' })
    "@entity": string;

    @Expose({ name: 'commission_id' })
    @IsString()
    commissionId: string;

    @Expose({ name: 'contact_id' })
    @IsString()
    contactId: string;

    @Expose({ name: 'conversion_type' })
    @IsEnum(conversionTypeEnum)
    conversionType: conversionTypeEnum;

    @Expose({ name: 'promoter_id' })
    @IsString()
    promoterId: string;

    @Expose({ name: 'link_id' })
    @IsString()
    linkId: string;

    @Expose({ name: 'amount' })
    @IsNumber()
    amount: number;

    @Expose({ name: 'revenue' })
    @IsNumber()
    revenue: number;

    @Expose({ name: 'created_at' })
    @IsDate()
    createdAt: Date;

    @Expose({ name: 'updated_at' })
    @IsDate()
    updatedAt: Date;
};

export class ContactCreatedEventData {
    @Expose({ name: '@entity' })
    "@entity": string;

    @Expose({ name: 'contact_id' })
    @IsString()
    contactId: string;

    @Expose({ name: 'email' })
    @IsOptional()
    @IsString()
    email?: string;

    @Expose({ name: 'first_name' })
    @IsOptional()
    @IsString()
    firstName?: string;

    @Expose({ name: 'last_name' })
    @IsOptional()
    @IsString()
    lastName?: string;

    @Expose({ name: 'phone' })
    @IsOptional()
    @IsString()
    phone?: string;

    @Expose({ name: 'created_at' })
    @IsDate()
    createdAt: Date;

    @Expose({ name: 'updated_at' })
    @IsDate()
    updatedAt: Date;
};