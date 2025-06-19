import {
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';
import { CirclePromoter } from './circlePromoter.entity';
import { SignUp } from './signUp.entity';
import { Link } from './link.entity';
import { ProgramPromoter } from './programPromoter.entity';
import { PromoterMember } from './promoterMember.entity';
import { Purchase } from './purchase.entity';
import { Commission } from './commission.entity';
import { promoterStatusEnum } from 'src/enums';

@Entity()
export class Promoter {
	@PrimaryGeneratedColumn('uuid', { name: 'promoter_id' })
	promoterId: string;

	@Column('varchar')
	name: string;

	@Column('varchar', { name: 'logo_url', nullable: true })
	logoUrl: string;

	@Column('enum', { enum: promoterStatusEnum, default: promoterStatusEnum.ACTIVE })
	status: promoterStatusEnum;

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

	@OneToMany(() => SignUp, (signUp) => signUp.promoter)
	signUps: SignUp[];

	@OneToMany(() => Link, (link) => link.promoter)
	links: Link[];

	@OneToMany(() => Purchase, (purchase) => purchase.promoter)
	purchases: Purchase[];

	@OneToMany(() => PromoterMember, (promoterMember) => promoterMember.promoter)
	promoterMembers: PromoterMember[];

	@OneToMany(() => CirclePromoter, (circlePromoter) => circlePromoter.promoter)
	circlePromoters: CirclePromoter[];

	@OneToMany(() => ProgramPromoter, (programPromoter) => programPromoter.promoter)
	programPromoters: ProgramPromoter[];

	@OneToMany(() => Commission, (commission) => commission.promoter)
	commissions: Commission[];
}
