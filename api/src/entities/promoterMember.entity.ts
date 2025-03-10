import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryColumn,
	UpdateDateColumn,
} from 'typeorm';
import { Member } from './member.entity';
import { Promoter } from './promoter.entity';
import { statusEnum, roleEnum } from '../enums';

@Entity()
export class PromoterMember {
	@PrimaryColumn('uuid', { name: 'promoter_id' })
	promoterId: string;

	@PrimaryColumn('uuid', { name: 'member_id' })
	memberId: string;

	@Column('enum', { enum: statusEnum, default: statusEnum.ACTIVE })
	status: statusEnum;

	@Column('enum', { enum: roleEnum, default: roleEnum.VIEWER })
	role: roleEnum;

	@CreateDateColumn({
		type: 'time with time zone',
		default: () => `now()`,
		name: 'created_at',
	})
	createdAt: Date;

	@UpdateDateColumn({
		type: 'time with time zone',
		default: () => `now()`,
		name: 'updated_at',
	})
	updatedAt: Date;

	@ManyToOne(() => Promoter, (promoter) => promoter.promoterMembers)
	@JoinColumn({
		name: 'promoter_id',
		referencedColumnName: 'promoterId',
	})
	promoter: Promoter;

	@ManyToOne(() => Member, (member) => member.promoterMembers)
	@JoinColumn({
		name: 'member_id',
		referencedColumnName: 'memberId',
	})
	member: Member;
}
