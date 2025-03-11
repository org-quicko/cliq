import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryColumn,
	UpdateDateColumn,
} from 'typeorm';
import { Program } from './program.entity';
import { User } from './user.entity';
import { statusEnum, roleEnum } from '../enums';

@Entity()
export class ProgramUser {
	@PrimaryColumn('uuid', { name: 'program_id' })
	programId: string;

	@PrimaryColumn('uuid', { name: 'user_id' })
	userId: string;

	@Column('enum', { enum: statusEnum, default: statusEnum.ACTIVE })
	status: statusEnum;

	@Column('enum', { enum: roleEnum, default: roleEnum.VIEWER })
	role: roleEnum;

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

	@ManyToOne(() => Program, (program) => program.programUsers, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({
		name: 'program_id',
		referencedColumnName: 'programId',
	})
	program: Program;

	@ManyToOne(() => User, (user) => user.programUsers, { onDelete: 'CASCADE' })
	@JoinColumn({
		name: 'user_id',
		referencedColumnName: 'userId',
	})
	user: User;
}
