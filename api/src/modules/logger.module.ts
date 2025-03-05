import { Global, Module } from '@nestjs/common';
import { LoggerService } from 'src/services/logger.service';

@Global() // 👈 Makes the module available globally
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
