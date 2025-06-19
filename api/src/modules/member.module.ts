import { forwardRef, Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MemberService } from '../services/member.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberController } from '../controllers/member.controller';
import { Member } from '../entities/member.entity';
import { PromoterMember } from '../entities/promoterMember.entity';
import { MemberAuthService } from '../services/memberAuth.service';
import { PromoterModule } from './promoter.module';
import { MemberConverter } from 'src/converters/member.converter';

@Global()
@Module({
	imports: [
		TypeOrmModule.forFeature([
			Member,
			PromoterMember
		]),
		// JwtModule.register({
		// 	secret: process.env.JWT_SECRET!,
		// 	signOptions: { expiresIn: '30d' },
		// }),
		forwardRef(() => PromoterModule),
	],
	controllers: [MemberController],
	providers: [MemberService, MemberAuthService, MemberConverter],
	exports: [MemberService, MemberAuthService, MemberConverter],
})
export class MemberModule { }
