import {
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';
import { Circle } from './circle.entity';
import { Contact } from './contact.entity';
import { Function } from './function.entity';
import { Link } from './link.entity';
import { Member } from './member.entity';
import { ProgramPromoter } from './programPromoter.entity';
import { ProgramUser } from './programUser.entity';
import { visibilityEnum, referralKeyTypeEnum, dateFormatEnum } from '../enums';
import { ApiKey } from './apiKey.entity';
import { Webhook } from './webhook.entity';

@Entity()
export class Program {
	@PrimaryGeneratedColumn('uuid', { name: 'program_id' })
	programId: string;

	@Column('varchar')
	name: string;

	@Column('varchar')
	website: string;

	@Column('enum', { enum: visibilityEnum, default: visibilityEnum.PUBLIC })
	visibility: visibilityEnum;

	@Column('varchar')
	currency: string;

	@Column('enum', { name: 'referral_key_type', enum: referralKeyTypeEnum })
	referralKeyType: referralKeyTypeEnum;

	@Column('varchar', { name: 'logo_url', nullable: true })
	logoUrl: string;

	@Column('varchar', { name: 'theme_color', default: '' })
	themeColor: string;

	@Column('varchar', { name: 'terms_and_conditions', default: '' })
	termsAndConditions: string;

	@Column('enum', {
		enum: dateFormatEnum,
		default: dateFormatEnum.DD_MM_YYYY, 
		name: 'date_format',
	})
	dateFormat: dateFormatEnum;

	@Column('varchar', { name: 'time_zone' })
	timeZone: string;

	@OneToMany(() => ApiKey, (apiKey) => apiKey.program)
	apiKeys: ApiKey[];

	@OneToMany(() => Webhook, (webhook) => webhook.program)
	webhooks: Webhook[];

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

	@OneToMany(() => Circle, (circle) => circle.program)
	circles: Circle[];

	@OneToMany(() => Function, (func) => func.program)
	functions: Function[];

	@OneToMany(() => Link, (link) => link.program)
	links: Link[];

	@OneToMany(() => Member, (member) => member.program)
	members: Member[];

	@OneToMany(
		() => ProgramPromoter,
		(programPromoter) => programPromoter.program,
	)
	programPromoters: ProgramPromoter[];

	@OneToMany(() => ProgramUser, (programUser) => programUser.program)
	programUsers: ProgramUser[];

	@OneToMany(() => Contact, (contact) => contact.program)
	contacts: Contact[];
}
