import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromoterModule } from '../modules/promoter.module';
import { ProgramModule } from './program.module';
import { Link } from '../entities';
import { LinkController } from '../controllers/link.controller';
import { LinkService } from '../services/link.service';
import { LinkConverter } from '../converters/link.converter';
import { LinkAnalyticsView } from 'src/entities/linkAnalytics.view';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Link, 
			LinkAnalyticsView
		]), 
		forwardRef(() => ProgramModule), 
		forwardRef(() => PromoterModule),
	],
	controllers: [LinkController],
	providers: [LinkService, LinkConverter],
	exports: [LinkService, LinkConverter],
})
export class LinkModule {}
