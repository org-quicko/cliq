import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ApiKey } from "../entities";
import { ApiKeyController } from "../controllers/apiKey.controller";
import { ApiKeyService } from "../services/apiKey.service";
import { ProgramModule } from "./program.module";
import { ApiKeyConverter } from "src/converters/apiKey.converter";
import { CommissionModule } from "./commission.module";

@Global()
@Module({
    imports: [
        TypeOrmModule.forFeature([
            ApiKey
        ]),
        ProgramModule,
        CommissionModule,
    ],
    providers: [ApiKeyService, ApiKeyConverter],
    controllers: [ApiKeyController],
    exports: [ApiKeyService],
})
export class ApiKeyModule { }