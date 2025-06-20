import {
	BeforeInsert,
	Column,
	CreateDateColumn,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Program } from './program.entity';
import { SALT_ROUNDS } from '../constants';
import { statusEnum } from 'src/enums';

@Entity('api_key')
export class ApiKey {
	@PrimaryGeneratedColumn('uuid', { name: 'api_key_id' })
	apiKeyId: string;

	@Index()
	@Column('varchar', { unique: true })
	key: string;

	@Column('varchar')
	secret: string;

	@Column('enum', { enum: statusEnum, default: statusEnum.ACTIVE })
	status: statusEnum;

	@ManyToOne(() => Program, (program) => program.apiKeys, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({
		name: 'program_id',
		referencedColumnName: 'programId',
	})
	program: Program;

	@Column('uuid', { name: 'program_id' })
	programId: string;

	@CreateDateColumn({
		name: 'created_at',
		default: () => `NOW()`,
		type: 'timestamp with time zone',
	})
	createdAt: Date;

	@CreateDateColumn({
		name: 'updated_at',
		default: () => `NOW()`,
		type: 'timestamp with time zone',
	})
	updatedAt: Date;

	@BeforeInsert()
	async hashSecret() {
		const salt = await bcrypt.genSalt(SALT_ROUNDS);
		this.secret = await bcrypt.hash(this.secret, salt);
	}
}
