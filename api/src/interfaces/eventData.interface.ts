import { purchaseEntityName, signUpEntityName } from "src/constants";
import { conversionTypeEnum, triggerEnum } from "src/enums";

export interface TriggerEventData {
    [key: string] : {
        "@entity": string;
        triggerType: triggerEnum;
        contactId: string;
        promoterId: string;
        linkId: string;
        itemId?: string;
        amount?: number;
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