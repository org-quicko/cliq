import * as bcrypt from 'bcrypt';
import { SALT_ROUNDS } from 'src/constants';
import {
	BeforeInsert,
	BeforeUpdate,
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
	Unique,
	UpdateDateColumn,
} from 'typeorm';
import { Program } from './program.entity';
import { PromoterMember } from './promoterMember.entity';

@Entity()
@Unique('program_id_email_unique', ['program', 'email'])
export class Member {
	@PrimaryGeneratedColumn('uuid', { name: 'member_id' })
	memberId: string;

	@Column('varchar')
	email: string;

	@Column('varchar', { name: 'normalized_email', nullable: true })
	normalizedEmail: string;

	@Column('varchar')
	password: string;

	@Column('varchar', { name: 'first_name' })
	firstName: string;

	@Column('varchar', { name: 'last_name' })
	lastName: string;

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

	@OneToMany(
		() => PromoterMember,
		(promoterMember) => promoterMember.member,
		{ onDelete: 'CASCADE', cascade: ['remove', 'insert'] },
	)
	promoterMembers: PromoterMember[];

	@ManyToOne(() => Program, (program) => program.members, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({
		name: 'program_id',
		referencedColumnName: 'programId',
	})
	program: Program;

	@BeforeInsert()
	@BeforeUpdate()
	setNormalizedEmail() {
		if (this.email) {
			this.normalizedEmail = this.email
				.toLowerCase()
				.replace(/[._\-\/\\+]+/g, ' ')
				.replace(/[&|!:*()'\"<>@]/g, ' ')
				.replace(/\s+/g, ' ')
				.trim();
		}
	}

	@BeforeInsert()
	async hashPassword() {
		const salt = await bcrypt.genSalt(SALT_ROUNDS);
		this.password = await bcrypt.hash(this.password, salt);
	}
}
