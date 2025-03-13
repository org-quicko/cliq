import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	OneToOne,
	PrimaryColumn,
	UpdateDateColumn,
} from 'typeorm';
import { Link } from './link.entity';
import { Promoter } from './promoter.entity';
import { Contact } from './contact.entity';
import { UtmParams } from './utmParams';

@Entity()
export class SignUp {
	@OneToOne(() => Contact, { onDelete: 'CASCADE' })
	@JoinColumn({
		name: 'contact_id',
		referencedColumnName: 'contactId',
	})
	contact: Contact;

	@PrimaryColumn('uuid', { name: 'contact_id' })
	contactId: string;

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

	@ManyToOne(() => Promoter, (promoter) => promoter.signUps, { onDelete: 'CASCADE' })
	@JoinColumn({
		name: 'promoter_id',
		referencedColumnName: 'promoterId',
	})
	promoter: Promoter;

	@Column('uuid', { name: 'promoter_id' })
	promoterId: string;

	@ManyToOne(() => Link, (link) => link.signUps, { onDelete: 'SET NULL' })
	@JoinColumn({
		name: 'link_id',
		referencedColumnName: 'linkId',
	})
	link: Link;

	@Column('uuid', { name: 'link_id' })
	linkId: string;
}
