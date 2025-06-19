import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';
import { Link } from './link.entity';
import { Promoter } from './promoter.entity';
import { Contact } from './contact.entity';
import { UtmParams } from 'src/classes';
import { NumericToNumber } from '../utils';

@Entity()
export class Purchase {
	@PrimaryGeneratedColumn('uuid', { name: 'purchase_id' })
	purchaseId: string;

	@Column('varchar', { name: 'item_id' })
	itemId: string;

	@Column('varchar', { name: 'contact_id' })
	contactId: string;

	@Column('decimal', { transformer: NumericToNumber })
	amount: number;

	@Column({ type: 'jsonb', nullable: true, name: 'utm_params' })
	utmParams: UtmParams;

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

	@ManyToOne(() => Link, (link) => link.purchases, { onDelete: 'SET NULL' })
	@JoinColumn({
		name: 'link_id',
		referencedColumnName: 'linkId',
	})
	link: Link;

	@ManyToOne(() => Promoter, (promoter) => promoter.purchases, { onDelete: 'SET NULL' })
	@JoinColumn({
		name: 'promoter_id',
		referencedColumnName: 'promoterId',
	})
	promoter: Promoter;

	@Column('uuid', { name: 'promoter_id' })
	promoterId: string;

	@ManyToOne(() => Contact, (contact) => contact.purchases, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({
		name: 'contact_id',
		referencedColumnName: 'contactId',
	})
	contact: Contact;
}
