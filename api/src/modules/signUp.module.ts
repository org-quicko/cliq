import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact, SignUp } from 'src/entities';
import { ContactModule } from './contact.module';
import { SignUpService } from 'src/services/signUp.service';
import { SignUpController } from 'src/controllers/signUp.controller';
import { LinkModule } from './link.module';
import { ProgramModule } from './program.module';
import { SignUpConverter } from 'src/converters/signup/signUp.dto.converter';

@Module({
	imports: [
		TypeOrmModule.forFeature([SignUp, Contact]), 
		ContactModule, 
		LinkModule, 
		forwardRef(() => ProgramModule)
	],
	controllers: [SignUpController],
	providers: [SignUpService, SignUpConverter],
	exports: [SignUpService, SignUpConverter],
})
export class SignUpModule {}
