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
import { statusEnum, memberRoleEnum } from '../enums';

@Entity()
export class PromoterMember {
	@PrimaryColumn('uuid', { name: 'promoter_id' })
	promoterId: string;

	@PrimaryColumn('uuid', { name: 'member_id' })
	memberId: string;

	@Column('enum', { enum: statusEnum, default: statusEnum.ACTIVE })
	status: statusEnum;

	@Column('enum', { enum: memberRoleEnum, default: memberRoleEnum.VIEWER })
	role: memberRoleEnum;

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

	@ManyToOne(() => Promoter, (promoter) => promoter.promoterMembers, { onDelete: 'CASCADE' })
	@JoinColumn({
		name: 'promoter_id',
		referencedColumnName: 'promoterId',
	})
	promoter: Promoter;

	@ManyToOne(() => Member, (member) => member.promoterMembers, { onDelete: 'CASCADE' })
	@JoinColumn({
		name: 'member_id',
		referencedColumnName: 'memberId',
	})
	member: Member;
}
