import { conversionTypeEnum, triggerEnum } from "src/enums";

export interface TriggerEventData {
    triggerType: triggerEnum;
    contactId: string;
    promoterId: string;
    programId: string;
    linkId: string;
    itemId?: string;
    amount?: number;
};

export interface SignUpCreatedEventData extends TriggerEventData {
    triggerType: triggerEnum.SIGNUP;
};

export interface PurchaseCreatedEventData extends TriggerEventData {
    triggerType: triggerEnum.PURCHASE;
    itemId: string;
    amount: number;
};

export interface GenerateCommissionEventData {
    contactId: string;
    conversionType: conversionTypeEnum;
    promoterId: string;
    linkId: string;
    revenue: number;
    amount: number;
};

export interface SwitchCircleEventData {
    promoterId: string;
    programId: string;
    currentCircleId: string;
    targetCircleId: string;
};