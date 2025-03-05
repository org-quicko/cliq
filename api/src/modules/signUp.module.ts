import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact, SignUp } from 'src/entities';
import { ContactModule } from './contact.module';
import { SignUpService } from 'src/services/signUp.service';
import { SignUpConverter } from 'src/converters/signUp.converter';
import { SignUpController } from 'src/controllers/signUp.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SignUp,
      Contact,
    ]),
    ContactModule,
  ],
  controllers: [SignUpController],
  providers: [SignUpService, SignUpConverter],
  exports: [SignUpService, SignUpConverter]
})
export class SignUpModule { }
