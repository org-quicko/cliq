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
import { Circle } from './circle.entity';
import { Program } from './program.entity';
// import { Condition } from './condition';
import { effectEnum, triggerEnum } from '../enums';
import { Condition } from './condition.entity';
import { Effect } from './effect';
import { functionStatusEnum } from 'src/enums/functionStatus.enum';

@Entity()
export class Function {
  @PrimaryGeneratedColumn('uuid', { name: 'function_id' })
  functionId: string;

  @Column('varchar')
  name: string;

  @Column('enum', { enum: triggerEnum })
  trigger: triggerEnum;

  @OneToMany(() => Condition, (condition) => condition.func)
  conditions: Condition[];

  @Column('enum', { name: 'effect_type', enum: effectEnum, default: effectEnum.GENERATE_COMMISSION })
  effectType: effectEnum;

  @Column({ type: 'jsonb' })
  effect: Effect;

  @Column('enum', { enum: functionStatusEnum, default: functionStatusEnum.ACTIVE })
  status: functionStatusEnum;

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

  @ManyToOne(() => Circle, (circle) => circle.functions)
  @JoinColumn({
    name: 'circle_id',
    referencedColumnName: 'circleId',
  })
  circle: Circle;

  @Column('uuid', { name: 'circle_id' })
  circleId: string;

  @ManyToOne(() => Program, (program) => program.functions, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'program_id',
    referencedColumnName: 'programId',
  })
  program: Program;

  @Column('uuid', { name: 'program_id' })
  programId: string;
}
