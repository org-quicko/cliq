import { forwardRef, Module } from '@nestjs/common';
import { ContactService } from '../services/contact.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact } from '../entities/contact.entity';
import { ContactConverter } from '../converters/contact.converter';
import { ProgramModule } from './program.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([Contact]), 
		forwardRef(() => ProgramModule)
	],
	providers: [ContactService, ContactConverter],
	exports: [ContactService, ContactConverter],
})
export class ContactModule {}
