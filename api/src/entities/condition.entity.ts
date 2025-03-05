import { conditionOperatorEnum, conditionParameterEnum } from "../enums";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Function } from "./function.entity";

// abstract class BaseCondition {
//     @IsDefined()
//     @IsEnum(conditionParameterEnum)
//     parameter: conditionParameterEnum;

//     @IsDefined()
//     @IsEnum(conditionOperatorEnum)
//     operator: conditionOperatorEnum;

//     @IsDefined()
//     value: string | number;

//     constructor(parameter: conditionParameterEnum, operator: conditionOperatorEnum, value: string | number) {
//         this.parameter = parameter;
//         this.operator = operator;
//         this.value = value;
//     }

//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     evaluate(input: any): boolean {
//         return false;
//     }
// }

// export class NumOfSignupsCondition extends BaseCondition {
//     @IsDefined()
//     @IsNumber()
//     override value: number;

//     constructor(
//         parameter: conditionParameterEnum.NUM_OF_SIGNUPS,
//         operator: conditionOperatorEnum.LESS_THAN_OR_EQUAL_TO | conditionOperatorEnum.EQUALS,
//         value: number
//     ) {
//         super(parameter, operator, value);
//     }

//     /**
//      * 
//      * @param numSignUps Number of signups of the promoter
//      * @returns true if number of signups satisfy the condition
//      */
//     override evaluate(numSignUps: number): boolean {
//         if(this.operator === conditionOperatorEnum.LESS_THAN_OR_EQUAL_TO) {
//             return numSignUps <= this.value;
//         } else if (this.operator === conditionOperatorEnum.EQUALS) {
//             return numSignUps === this.value;
//         }
//         return false;
//     }
// }

// export class NumOfPurchasesCondition extends BaseCondition {
//     @IsDefined()
//     @IsNumber()
//     override value: number;

//     constructor(
//         parameter: conditionParameterEnum.NUM_OF_PURCHASES,
//         operator: conditionOperatorEnum.LESS_THAN_OR_EQUAL_TO | conditionOperatorEnum.EQUALS,
//         value: number
//     ) {
//         super(parameter, operator, value);
//     }

//     override evaluate(numPurchases: number): boolean {
//         if(this.operator === conditionOperatorEnum.LESS_THAN_OR_EQUAL_TO) {
//             return numPurchases <= this.value;
//         } else if (this.operator === conditionOperatorEnum.EQUALS) {
//             return numPurchases === this.value;
//         }
//         return false;
//     }
// }

// export class ExternalIdCondition extends BaseCondition {
//     @IsDefined()
//     @IsString()
//     override value: string;

//     constructor(
//         parameter: conditionParameterEnum.EXTERNAL_ID,
//         operator: conditionOperatorEnum.EQUALS | conditionOperatorEnum.CONTAINS, 
//         value: string
//     ) {
//         super(parameter, operator, value);
//     }

//     override evaluate(externalId: string): boolean {
//         if (this.operator === conditionOperatorEnum.EQUALS) {
//             return externalId === this.value;
//         } else if (this.operator === conditionOperatorEnum.CONTAINS) {
//             return this.value.includes(externalId);
//         }
//         return false;
//     }
// }

// export type Condition = NumOfSignupsCondition | NumOfPurchasesCondition | ExternalIdCondition;

@Entity('condition')
export class Condition {

    @PrimaryGeneratedColumn('uuid', { name: 'condition_id' })
    conditionId: string;

    @ManyToOne(() => Function, (func) => func.conditions, { onDelete: 'CASCADE' })
    @JoinColumn({
        name: 'function_id',
        referencedColumnName: 'functionId'
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
        externalId,
    }: {
        numSignUps?: number;
        numPurchases?: number;
        externalId?: string;
    }): boolean {
        let parsedValue: string | number = this.value;

        
        switch (this.parameter) {
            case conditionParameterEnum.NUM_OF_SIGNUPS:
                parsedValue = Number(parsedValue);

                if (numSignUps === undefined) return false;
                if (this.operator === conditionOperatorEnum.LESS_THAN_OR_EQUAL_TO) {
                    return numSignUps <= parsedValue;
                } else if (this.operator === conditionOperatorEnum.EQUALS) {
                    return numSignUps === parsedValue;
                }
                return false;

            case conditionParameterEnum.NUM_OF_PURCHASES:
                parsedValue = Number(parsedValue);

                if (numPurchases === undefined) return false;
                if (this.operator === conditionOperatorEnum.LESS_THAN_OR_EQUAL_TO) {
                    return numPurchases <= parsedValue;
                } else if (this.operator === conditionOperatorEnum.EQUALS) {
                    return numPurchases === parsedValue;
                }
                return false;

            case conditionParameterEnum.EXTERNAL_ID:
                if (externalId === undefined) return false;
                if (this.operator === conditionOperatorEnum.EQUALS) {
                    return externalId === parsedValue;
                } else if (this.operator === conditionOperatorEnum.CONTAINS) {
                    return parsedValue.includes(externalId);
                }
                return false;

            default:
                return false;
        }
    }

}