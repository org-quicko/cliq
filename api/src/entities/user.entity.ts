import { BeforeInsert, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import * as bcrypt from "bcrypt";
import { SALT_ROUNDS } from 'src/constants';
import { ProgramUser } from './programUser.entity';


@Entity()
export class User {

    constructor(item: Partial<User>) {
        Object.assign(this, item);
    }

    @PrimaryGeneratedColumn('uuid', { name: 'user_id' })
    userId: string;

    @Column('varchar', { unique: true })
    email: string;

    @Column('varchar')
    password: string;

    @Column('varchar', { name: 'first_name' })
    firstName: string;

    @Column('varchar', { name: 'last_name' })
    lastName: string;

    @Column('boolean', { name: 'is_super_admin', default: false })
    isSuperAdmin: boolean;

    @CreateDateColumn({ type: 'time with time zone', default: () => `now()`, name: 'created_at' })
    createdAt: Date;
    
    @UpdateDateColumn({ type: 'time with time zone', default: () => `now()`, name: 'updated_at' })
    updatedAt: Date;



    @OneToMany(() => ProgramUser, (programUser) => programUser.user)
    programUsers: ProgramUser[];

    @BeforeInsert()
    async hashPassword() {
        const salt = await bcrypt.genSalt(SALT_ROUNDS);
        this.password = await bcrypt.hash(this.password, salt);
    }

}
