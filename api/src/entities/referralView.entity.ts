import { contactStatusEnum } from '../enums';
import { NumericToNumber } from '../utils/numericToNumber.util';
import {
	Entity,
	Column,
	Index,
	CreateDateColumn,
	UpdateDateColumn,
	PrimaryColumn,
} from 'typeorm';

@Entity('referral_mv')
export class ReferralView {
	@PrimaryColumn({ name: 'program_id', type: 'uuid' })
	programId: string;

	@PrimaryColumn({ name: 'promoter_id', type: 'uuid' })
	promoterId: string;

	@PrimaryColumn({ name: 'contact_id', type: 'uuid' })
	contactId: string;

	@Column({ name: 'status', type: 'enum', enum: contactStatusEnum })
	status: contactStatusEnum;

	@Column({ name: 'contact_info', type: 'varchar' })
	contactInfo: string;

	@Column({ name: 'total_revenue', type: 'numeric', transformer: NumericToNumber, default: 0 })
	totalRevenue: number;

	@Column({ name: 'total_commission', type: 'numeric', transformer: NumericToNumber, default: 0 })
	totalCommission: number;

	@CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
	createdAt: Date;

	@UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
	updatedAt: Date;
}
