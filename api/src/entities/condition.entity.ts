import { conditionOperatorEnum, conditionParameterEnum } from '../enums';
import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { Function } from './function.entity';

@Entity('condition')
export class Condition {
	@PrimaryGeneratedColumn('uuid', { name: 'condition_id' })
	conditionId: string;

	@ManyToOne(() => Function, (func) => func.conditions, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({
		name: 'function_id',
		referencedColumnName: 'functionId',
	})
	func: Function;

	@Column('enum', { enum: conditionParameterEnum })
	parameter: conditionParameterEnum;

	@Column('enum', { enum: conditionOperatorEnum })
	operator: conditionOperatorEnum;

	// WHILE STORING TO DB- value shall be converted to varchar
	// WHILE EVALUTING CONDITION- value shall be converted to the appropriate data type on basis of parameter type
	@Column('varchar')
	value: string;

	public evaluate({
		numSignUps,
		numPurchases,
		itemId,
	}: {
		numSignUps?: number;
		numPurchases?: number;
		itemId?: string;
	}): boolean {
		let parsedValue: string | number = this.value;

		switch (this.parameter) {
			case conditionParameterEnum.NUM_OF_SIGNUPS:
				parsedValue = Number(parsedValue);

				if (numSignUps === undefined) return false;
				if (
					this.operator ===
					conditionOperatorEnum.LESS_THAN_OR_EQUAL_TO
				) {
					return numSignUps <= parsedValue;
				} else if (this.operator === conditionOperatorEnum.EQUALS) {
					return numSignUps === parsedValue;
				}
				return false;

			case conditionParameterEnum.NUM_OF_PURCHASES:
				parsedValue = Number(parsedValue);

				if (numPurchases === undefined) return false;
				if (
					this.operator ===
					conditionOperatorEnum.LESS_THAN_OR_EQUAL_TO
				) {
					return numPurchases <= parsedValue;
				} else if (this.operator === conditionOperatorEnum.EQUALS) {
					return numPurchases === parsedValue;
				}
				return false;

			case conditionParameterEnum.ITEM_ID:
				if (itemId === undefined) return false;
				if (this.operator === conditionOperatorEnum.EQUALS) {
					return itemId === parsedValue;
				} else if (this.operator === conditionOperatorEnum.CONTAINS) {
					return parsedValue.includes(itemId);
				}
				return false;

			default:
				return false;
		}
	}
}
