import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Link } from './link.entity';
import { Promoter } from './promoter.entity';
import { Contact } from './contact.entity';

@Entity()
export class Purchase {
  @PrimaryGeneratedColumn('uuid', { name: 'purchase_id' })
  purchaseId: string;

  @Column('varchar', { name: 'external_id' })
  externalId: string;

  @Column('varchar', { name: 'contact_id' })
  contactId: string;

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

  @ManyToOne(() => Link, (link) => link.purchases)
  @JoinColumn({
    name: 'link_id',
    referencedColumnName: 'linkId',
  })
  link: Link;

  @ManyToOne(() => Promoter, (promoter) => promoter.purchases)
  @JoinColumn({
    name: 'promoter_id',
    referencedColumnName: 'promoterId',
  })
  promoter: Promoter;

  @ManyToOne(() => Contact, (contact) => contact.purchases, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'contact_id',
    referencedColumnName: 'contactId',
  })
  contact: Contact;
}
