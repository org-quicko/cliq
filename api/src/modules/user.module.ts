import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from '../services/user.service';
import { UserController } from "../controllers/user.controller";
import { User, ProgramUser } from '../entities';
import { UserConverter } from '../converters/user.converter';
import { UserPermissionsGuard } from '../guards/permissions/userPermissions.guard';
import { UserAuthService } from '../services/userAuth.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      ProgramUser,
    ]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET!,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [UserController],
  providers: [UserService, UserAuthService, UserPermissionsGuard, UserConverter],
  exports: [UserService, UserAuthService, UserPermissionsGuard, UserConverter]
})
export class UserModule { }
