import { commissionEntityName, purchaseEntityName, signUpEntityName } from "src/constants";
import { triggerEnum } from "src/enums";
import { conversionTypeEnum } from '../enums/conversionType.enum';

export interface TriggerEventData {
    [key: string] : {
        "@entity": string;
        triggerType: triggerEnum;
        conversionType?: conversionTypeEnum;
        contactId: string;
        promoterId: string;
        commissionId?: string;
        linkId: string;
        itemId?: string;
        amount?: number;
        revenue?: number;
        createdAt: Date;
        updatedAt: Date;
        utmParams?: object;
    },
};

export interface SignUpCreatedEventData extends TriggerEventData {
    [signUpEntityName]: {
        "@entity": string,
        triggerType: triggerEnum;
        contactId: string;
        promoterId: string;
        linkId: string;
        createdAt: Date;
        updatedAt: Date;
        utmParams?: object;
    }
};

export interface PurchaseCreatedEventData extends TriggerEventData {
    [purchaseEntityName]: {
        "@entity": string,
        triggerType: triggerEnum;
        contactId: string;
        promoterId: string;
        linkId: string;
        itemId: string;
        amount: number;
        createdAt: Date;
        updatedAt: Date;
        utmParams?: object;
    }
};

export interface CommissionCreatedEventData {
    [commissionEntityName]: {
        "@entity": string,
        commissionId: string;
        contactId: string;
        conversionType: conversionTypeEnum;
        promoterId: string;
        linkId: string;
        amount: number;
        revenue: number;
        createdAt: Date;
        updatedAt: Date;
    }
};