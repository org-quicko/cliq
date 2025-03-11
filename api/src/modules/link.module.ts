import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromoterModule } from '../modules/promoter.module';
import { ProgramModule } from './program.module';
import { Link } from '../entities';
import { LinkController } from '../controllers/link.controller';
import { LinkService } from '../services/link.service';
import { LinkConverter } from '../converters/link.converter';
import { LinkStatsView } from 'src/entities/link.view';

@Module({
	imports: [TypeOrmModule.forFeature([Link, LinkStatsView]), ProgramModule, PromoterModule],
	controllers: [LinkController],
	providers: [LinkService, LinkConverter],
	exports: [LinkService, ProgramModule, PromoterModule, LinkConverter],
})
export class LinkModule {}
