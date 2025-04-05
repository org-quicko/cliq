import {
	BeforeInsert,
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { SALT_ROUNDS } from '../constants';
import { ProgramUser } from './programUser.entity';
import { userRoleEnum } from '../enums';

@Entity()
export class User {
	@PrimaryGeneratedColumn('uuid', { name: 'user_id' })
	userId: string;

	@Column('varchar', { unique: true })
	email: string;

	@Column('varchar')
	password: string;

	@Column('varchar', { name: 'first_name' })
	firstName: string;

	@Column('varchar', { name: 'last_name' })
	lastName: string;

	@Column('enum', { enum: userRoleEnum, default: userRoleEnum.REGULAR })
	role: userRoleEnum;

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

	@OneToMany(() => ProgramUser, (programUser) => programUser.user)
	programUsers: ProgramUser[];

	@BeforeInsert()
	async hashPassword() {
		const salt = await bcrypt.genSalt(SALT_ROUNDS);
		this.password = await bcrypt.hash(this.password, salt);
	}
}
