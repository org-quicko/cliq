import { IsDefined, IsEnum, IsString, IsNumber, ValidateNested, IsOptional, IsUUID, Min } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { conditionOperatorEnum, conditionParameterEnum } from 'src/enums';

export class BaseConditionDto {

    @Expose({ name: 'parameter' })
    @IsDefined()
    @IsEnum(conditionParameterEnum)
    parameter: conditionParameterEnum;

    @Expose({ name: 'operator' })
    @IsDefined()
    @IsEnum(conditionOperatorEnum)
    operator: conditionOperatorEnum;

    @Expose({ name: 'value' })
    @IsDefined()
    @IsString()
    value: string | number; // Always stored as string, will be parsed at runtime
}

export class NumOfSignupsConditionDto extends BaseConditionDto {
    @Expose({ name: 'parameter' })
    @IsEnum([conditionParameterEnum.NUM_OF_SIGNUPS])
    parameter: conditionParameterEnum;

    @Expose({ name: 'operator' })
    @IsEnum([conditionOperatorEnum.LESS_THAN_OR_EQUAL_TO, conditionOperatorEnum.EQUALS])
    operator: conditionOperatorEnum;

    @Expose({ name: 'value' })
    @IsNumber()
    @Min(1)
    value: number;
}

export class NumOfPurchasesConditionDto extends BaseConditionDto {
    @Expose({ name: 'parameter' })
    @IsEnum([conditionParameterEnum.NUM_OF_PURCHASES])
    parameter: conditionParameterEnum;

    @Expose({ name: 'operator' })
    @IsEnum([conditionOperatorEnum.LESS_THAN_OR_EQUAL_TO, conditionOperatorEnum.EQUALS])
    operator: conditionOperatorEnum;

    @Expose({ name: 'value' })
    @IsNumber()
    @Min(1)
    value: number;
}

export class ItemIdConditionDto extends BaseConditionDto {
    @Expose({ name: 'parameter' })
    @IsEnum([conditionParameterEnum.ITEM_ID])
    parameter: conditionParameterEnum;

    @Expose({ name: 'operator' })
    @IsEnum([conditionOperatorEnum.EQUALS, conditionOperatorEnum.CONTAINS])
    operator: conditionOperatorEnum;

    @Expose({ name: 'value' })
    @IsString()
    value: string;
}

export class ConditionDto {

    @Expose({ name: 'condition_id' })
    @IsOptional()
    @IsUUID()
    conditionId?: string;

    @Expose({ name: 'condition' })
    @ValidateNested()
    @Type(() => Object, {
        discriminator: {
            property: 'parameter',
            subTypes: [
                { value: NumOfSignupsConditionDto, name: conditionParameterEnum.NUM_OF_SIGNUPS as string },
                { value: NumOfPurchasesConditionDto, name: conditionParameterEnum.NUM_OF_PURCHASES as string },
                { value: ItemIdConditionDto, name: conditionParameterEnum.ITEM_ID as string },
            ],
        },
        keepDiscriminatorProperty: true,
    })
    condition: NumOfSignupsConditionDto | NumOfPurchasesConditionDto | ItemIdConditionDto;
}