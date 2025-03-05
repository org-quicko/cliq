import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CirclePromoter } from './circlePromoter.entity';
import { Function } from './function.entity';
import { Program } from './program.entity';

@Entity()
export class Circle {
  constructor(item: Partial<Circle>) {
    Object.assign(this, item);
  }

  @PrimaryGeneratedColumn('uuid', { name: 'circle_id' })
  circleId: string;

  @Column('varchar')
  name: string;

  @Column('boolean', { name: 'is_default_circle', default: false })
  isDefaultCircle: boolean;

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

  @OneToMany(() => Function, (func) => func.circle)
  functions: Function[];

  @ManyToOne(() => Program, (program) => program.circles, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'program_id',
    referencedColumnName: 'programId',
  })
  program: Program;

  @Column('uuid', { name: 'program_id' })
  programId: string;

  @OneToMany(() => CirclePromoter, (circlePromoter) => circlePromoter.circle, { onDelete: 'CASCADE', cascade: ['insert', 'update', 'remove'] })
  circlePromoters: CirclePromoter[];
}
