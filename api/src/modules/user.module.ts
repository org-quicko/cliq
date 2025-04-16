import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from '../services/user.service';
import { UserController } from '../controllers/user.controller';
import { User, ProgramUser } from '../entities';
import { UserConverter } from '../converters/user.converter';
import { UserAuthService } from '../services/userAuth.service';

@Global()
@Module({
	imports: [
		TypeOrmModule.forFeature([User, ProgramUser]),
		// JwtModule.register({
		// 	secret: process.env.JWT_SECRET!,
		// 	signOptions: { expiresIn: '30d' },
		// }),
	],
	controllers: [UserController],
	providers: [UserService, UserAuthService, UserConverter],
	exports: [UserService, UserAuthService, UserConverter],
})
export class UserModule {}
