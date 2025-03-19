import { forwardRef, Module } from '@nestjs/common';
import { PurchaseService } from '../services/purchase.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseController } from '../controllers/purchase.controller';
import { Purchase } from '../entities/purchase.entity';
import { PurchaseConverter } from 'src/converters/purchase.converter';
import { ContactModule } from './contact.module';
import { Contact } from 'src/entities';
import { LinkModule } from './link.module';
import { ProgramModule } from './program.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([Purchase, Contact]), 
		ContactModule, 
		LinkModule, 
		forwardRef(() => ProgramModule),
	],
	controllers: [PurchaseController],
	providers: [PurchaseService, PurchaseConverter],
	exports: [PurchaseService, PurchaseConverter],
})
export class PurchaseModule {}
