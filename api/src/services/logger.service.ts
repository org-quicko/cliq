import {
	Injectable,
	InternalServerErrorException,
	OnModuleInit,
} from '@nestjs/common';
import * as winston from 'winston';
import { ConsoleLoggerProvider } from '@org.quicko/core';

@Injectable()
export class LoggerService implements OnModuleInit {
	private loggerProvider: ConsoleLoggerProvider = new ConsoleLoggerProvider();
	private logger: winston.Logger;

	constructor() {}

	async onModuleInit() {
		this.logger = await this.loggerProvider.createLogger();
	}

	private ensureLoggerInitialized() {
		if (!this.logger) {
			throw new InternalServerErrorException(
				'Logger not initialized yet',
			);
		}
	}

	info(message: string) {
		this.ensureLoggerInitialized();
		this.logger.info(message);
	}

	error(message: string, trace?: string) {
		this.ensureLoggerInitialized();
		this.logger.error(message, { trace });
	}

	warn(message: string) {
		this.ensureLoggerInitialized();
		this.logger.warn(message);
	}

	debug(message: string) {
		this.ensureLoggerInitialized();
		this.logger.debug(message);
	}

	verbose(message: string) {
		this.ensureLoggerInitialized();
		this.logger.verbose(message);
	}
}
