import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Contact } from './contact.entity';
import { conversionTypeEnum } from '../enums';
import { Promoter } from './promoter.entity';

@Entity()
export class Commission {
  @PrimaryGeneratedColumn('uuid', { name: 'commission_id' })
  commissionId: string;

  @Column('enum', { name: 'conversion_type', enum: conversionTypeEnum })
  conversionType: conversionTypeEnum; // inquire about this

  @Column('decimal')
  amount: number;

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

  @ManyToOne(() => Contact, (contact) => contact.commissions
    // , { onDelete: 'SET NULL' }
  )
  @JoinColumn({
    name: 'contact_id',
    referencedColumnName: 'contactId',
  })
  contact: Contact;

  @Column('uuid', { name: 'contact_id' })
  contactId: string;

  @ManyToOne(() => Promoter, (contact) => contact.commissions)
  @JoinColumn({
    name: 'promoter_id',
    referencedColumnName: 'promoterId',
  })
  promoter: Promoter;

  @Column('uuid', { name: 'promoter_id' })
  promoterId: string;
}
