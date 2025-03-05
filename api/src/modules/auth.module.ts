import { Global, Module } from "@nestjs/common";
import { RoleService } from "../services/role.service";
import { UnifiedAuthGuard } from "../guards/auth/auth.guard";
import { LinkModule } from "./link.module";
import { CircleModule } from "./circle.module";
import { FunctionModule } from "./function.module";

@Global()
@Module({
    imports: [LinkModule, CircleModule, FunctionModule],
    providers: [RoleService, UnifiedAuthGuard],
    exports: [RoleService, UnifiedAuthGuard]
})
export class AuthModule { }