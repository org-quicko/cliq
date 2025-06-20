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
import { Promoter } from './promoter.entity';

@Entity()
export class ProgramPromoter {
	@PrimaryColumn('uuid', { name: 'program_id' })
	programId: string;

	@PrimaryColumn('uuid', { name: 'promoter_id' })
	promoterId: string;

	@Column('boolean', { name: 'accepted_terms_and_conditions', default: false })
	acceptedTermsAndConditions: boolean;

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

	@ManyToOne(() => Program, (program) => program.programPromoters, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({
		name: 'program_id',
		referencedColumnName: 'programId',
	})
	program: Program;

	@ManyToOne(() => Promoter, (promoter) => promoter.programPromoters, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({
		name: 'promoter_id',
		referencedColumnName: 'promoterId',
	})
	promoter: Promoter;
}
