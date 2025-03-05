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
import { Program } from './program.entity';
import { Promoter } from './promoter.entity';
import { Purchase } from './purchase.entity';
import { SignUp } from './signUp.entity';

@Entity()
export class Link {
  @PrimaryGeneratedColumn('uuid', { name: 'link_id' })
  linkId: string;

  @Column('varchar')
  name: string;

  @Column('varchar')
  source: string;

  @Column('varchar')
  medium: string;

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

  @OneToMany(() => SignUp, (signUp) => signUp.link)
  signUps: SignUp[];

  @OneToMany(() => Purchase, (purchase) => purchase.link)
  purchases: Purchase[];

  @ManyToOne(() => Program, (program) => program.links)
  @JoinColumn({
    name: 'program_id',
    referencedColumnName: 'programId',
  })
  program: Program;

  @Column('uuid', { name: 'program_id' })
  programId: string;

  @ManyToOne(() => Promoter, (promoter) => promoter.links)
  @JoinColumn({
    name: 'promoter_id',
    referencedColumnName: 'promoterId',
  })
  promoter: Promoter;

  @Column('uuid', { name: 'promoter_id' })
  promoterId: string;
}
