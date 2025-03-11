import {
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryColumn,
	UpdateDateColumn,
} from 'typeorm';
import { Circle } from './circle.entity';
import { Promoter } from './promoter.entity';

@Entity('circle_promoter')
export class CirclePromoter {
	@PrimaryColumn('uuid', { name: 'circle_id' })
	circleId: string;

	@PrimaryColumn('uuid', { name: 'promoter_id' })
	promoterId: string;

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

	@ManyToOne(() => Circle, (circle) => circle.circlePromoters)
	@JoinColumn({
		name: 'circle_id',
		referencedColumnName: 'circleId',
	})
	circle: Circle;

	@ManyToOne(() => Promoter, (promoter) => promoter.circlePromoters)
	@JoinColumn({
		name: 'promoter_id',
		referencedColumnName: 'promoterId',
	})
	promoter: Promoter;
}
