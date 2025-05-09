import {
	IsDefined,
	IsEnum,
	IsNumber,
	IsUUID,
	Max,
	Min,
	ValidateNested,
} from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { CommissionType } from '../enums';

export class PercentageCommission {
	@Expose({ name: 'commission_type' })
	@IsEnum(CommissionType)
	commissionType: CommissionType.PERCENTAGE;

	@Expose({ name: 'commission_value' })
	@IsNumber()
	@Min(0.01)
	@Max(100)
	commissionValue: number;
}

export class FixedCommission {
	@Expose({ name: 'commission_type' })
	@IsEnum(CommissionType)
	commissionType: CommissionType.FIXED;

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
				{
					value: PercentageCommission,
					name: CommissionType.PERCENTAGE,
				},
				{
					value: FixedCommission,
					name: CommissionType.FIXED,
				},
			],
		},
		keepDiscriminatorProperty: true,
	})
	commission: PercentageCommission | FixedCommission;
}

export class SwitchCircleEffect {
	@Expose({ name: 'target_circle_id', toPlainOnly: true })
	@IsUUID()
	targetCircleId: string;
}

export type Effect = GenerateCommissionEffect | SwitchCircleEffect;
