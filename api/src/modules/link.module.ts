import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromoterModule } from '../modules/promoter.module';
import { ProgramModule } from './program.module';
import { Link } from '../entities';
import { LinkController } from '../controllers/link.controller';
import { LinkService } from '../services/link.service';
import { LinkConverter } from '../converters/link.converter';
import { LinkStatsView } from 'src/entities/linkStats.view';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Link, 
			LinkStatsView
		]), 
		forwardRef(() => ProgramModule), 
		forwardRef(() => PromoterModule),
	],
	controllers: [LinkController],
	providers: [LinkService, LinkConverter],
	exports: [LinkService, LinkConverter],
})
export class LinkModule {}
