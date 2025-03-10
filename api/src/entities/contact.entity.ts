import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Program } from './program.entity';
import { Purchase } from './purchase.entity';
import { Commission } from './commission.entity';
import { contactStatusEnum } from '../enums';
import { SignUp } from './signUp.entity';

@Entity()
export class Contact {

  @PrimaryGeneratedColumn('uuid', { name: 'contact_id' })
  contactId: string;

  @Column('varchar', { nullable: true })
  email: string;

  @Column('varchar', { name: 'first_name', nullable: true })
  firstName: string;

  @Column('varchar', { name: 'last_name', nullable: true })
  lastName: string;

  @Column('varchar', { nullable: true })
  phone: string;

  @Column('enum', { enum: contactStatusEnum, default: contactStatusEnum.LEAD })
  status: contactStatusEnum;

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

  @ManyToOne(() => Program, (program) => program.contacts, { onDelete: 'SET NULL' })
  @JoinColumn({
    name: 'program_id',
    referencedColumnName: 'programId',
  })
  program: Program;

  @Column('uuid', { name: 'program_id' })
  programId: string;

  @OneToOne(() => SignUp, (signup) => signup.contact)
  signup: SignUp;

  @OneToMany(() => Purchase, (purchase) => purchase.contact)
  purchases: Purchase[];

  @OneToMany(() => Commission, (commission) => commission.contact)
  commissions: Commission[];
}
