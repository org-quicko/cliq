import { Injectable, OnModuleInit } from '@nestjs/common';
import { LoggerFactory } from "@org-quicko/core";

@Injectable()
export class LoggerService implements OnModuleInit {
    onModuleInit() {
        LoggerFactory.createLogger();
    }
}