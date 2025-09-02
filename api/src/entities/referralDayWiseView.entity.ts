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

@Entity('referral_day_wise_mv')
export class ReferralDayWiseView {
	@PrimaryColumn({ name: 'date', type: 'date' })
	date: Date;

	@Index()
	@Column({ name: 'program_id', type: 'uuid' })
	programId: string;

	@Index()
	@Column({ name: 'promoter_id', type: 'uuid' })
	promoterId: string;

	@Index()
	@Column({ name: 'contact_id', type: 'uuid' })
	contactId: string;

	@Column({ name: 'status', type: 'enum', enum: contactStatusEnum })
	status: contactStatusEnum;

	@Column({ name: 'contact_info', type: 'varchar' })
	contactInfo: string;

	@Column({ name: 'daily_revenue', type: 'numeric', transformer: NumericToNumber, default: 0 })
	dailyRevenue: number;

	@Column({ name: 'daily_commission', type: 'numeric', transformer: NumericToNumber, default: 0 })
	dailyCommission: number;

	@CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
	createdAt: Date;

	@UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
	updatedAt: Date;
}
