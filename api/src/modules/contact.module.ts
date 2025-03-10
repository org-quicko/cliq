import { Module } from '@nestjs/common';
import { ContactService } from '../services/contact.service';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { ContactController } from "../controllers/contact.controller";
import { Contact } from '../entities/contact.entity';
import { ContactConverter } from '../converters/contact.converter';
import { LinkModule } from './link.module';

@Module({
	imports: [TypeOrmModule.forFeature([Contact]), LinkModule],
	controllers: [
		// ContactController
	],
	providers: [ContactService, ContactConverter],
	exports: [ContactService, ContactConverter, LinkModule],
})
export class ContactModule {}
