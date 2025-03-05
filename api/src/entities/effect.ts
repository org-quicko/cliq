import { IsDefined, IsEnum, IsNumber, IsUUID, Max, Min, ValidateNested } from "class-validator";
import { Expose, Type } from "class-transformer";
import { commissionTypeEnum } from "../enums/commissionType.enum";

export class PercentageCommissionEffect {
    @Expose({ name: 'commission_type' })
    @IsEnum(commissionTypeEnum)
    commissionType: commissionTypeEnum.PERCENTAGE;

    @Expose({ name: 'commission_value' })
    @IsNumber()
    @Min(0.01)
    @Max(100)
    commissionValue: number;
}

export class FixedCommissionEffect {
    @Expose({ name: 'commission_type' })
    @IsEnum(commissionTypeEnum)
    commissionType: commissionTypeEnum.FIXED;

    @Expose({ name: 'commission_value' })
    @IsNumber()
    @Min(0.01)
    commissionValue: number;
}

export class GenerateCommissionEffect {

    @IsDefined()
    @ValidateNested()
    @Type(() => Object, {
        discriminator: {
            property: 'commission_type',
            subTypes: [
                { value: PercentageCommissionEffect, name: commissionTypeEnum.PERCENTAGE },
                { value: FixedCommissionEffect, name: commissionTypeEnum.FIXED },
            ],
        },
        keepDiscriminatorProperty: true,
    })
    commission: PercentageCommissionEffect | FixedCommissionEffect;
}

export class SwitchCircleEffect {
    @Expose({ name: 'target_circle_id', toPlainOnly: true })
    @IsUUID()
    targetCircleId: string;
}


export type Effect = GenerateCommissionEffect | SwitchCircleEffect;