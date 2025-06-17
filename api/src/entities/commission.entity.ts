import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';
import { Contact } from './contact.entity';
import { conversionTypeEnum } from '../enums';
import { Promoter } from './promoter.entity';
import { Link } from './link.entity';
import { NumericToNumber } from 'src/utils/numericToNumber.util';

@Entity()
export class Commission {
	@PrimaryGeneratedColumn('uuid', { name: 'commission_id' })
	commissionId: string;

	@Column('enum', { name: 'conversion_type', enum: conversionTypeEnum })
	conversionType: conversionTypeEnum;

	@Column('uuid', { name: 'external_id' })
	externalId: string;

	@Column('decimal', { transformer: NumericToNumber })
	amount: number;

	@Column('decimal', { nullable: true, transformer: NumericToNumber })
	revenue: number;

	@CreateDateColumn({
		type: 'timestamp with time zone',
		default: () => `now()`,
		name: 'created_at',
	})
	createdAt: Date;

	@UpdateDateColumn({
		type: 'timestamp with time zone',
		default: () => `now()`,
		name: 'updated_at',
	})
	updatedAt: Date;

	@ManyToOne(() => Contact, (contact) => contact.commissions)
	@JoinColumn({
		name: 'contact_id',
		referencedColumnName: 'contactId',
	})
	contact: Contact;

	@Column('uuid', { name: 'contact_id' })
	contactId: string;

	@ManyToOne(() => Promoter, (contact) => contact.commissions, { onDelete: 'SET NULL' })
	@JoinColumn({
		name: 'promoter_id',
		referencedColumnName: 'promoterId',
	})
	promoter: Promoter;

	@Column('uuid', { name: 'promoter_id' })
	promoterId: string;
	
	@ManyToOne(() => Link, (link) => link.commissions, { onDelete: 'SET NULL' })
	@JoinColumn({
		name: 'link_id',
		referencedColumnName: 'linkId',
	})
	link: Link;

	@Column('uuid', { name: 'link_id' })
	linkId: string;
}
