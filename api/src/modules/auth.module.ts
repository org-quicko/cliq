import { Global, Module } from "@nestjs/common";
import { RoleService } from "../services/role.service";
import { UnifiedAuthGuard } from "../guards/auth/auth.guard";
import { LinkModule } from "./link.module";
import { CircleModule } from "./circle.module";

@Global()
@Module({
    imports: [LinkModule, CircleModule],
    providers: [RoleService, UnifiedAuthGuard],
    exports: [RoleService, UnifiedAuthGuard]
})
export class AuthModule { }