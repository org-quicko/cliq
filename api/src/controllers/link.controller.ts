import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Patch } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { LinkService } from '../services/link.service';
import { CreateLinkDto } from '../dtos';
import { LoggerService } from '../services/logger.service';
import { Permissions } from '../decorators/permissions.decorator';
import { Link } from '../entities';
import { AuthGuard } from '../guards/auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';

@ApiTags('Link')
@UseGuards(AuthGuard, PermissionsGuard)
@Controller('programs/:program_id/promoters/:promoter_id/links')
export class LinkController {
	constructor(
		private readonly linkService: LinkService,
		private logger: LoggerService,
	) { }

	/**
	 * Create link
	 */
	@ApiResponse({ status: 201, description: 'Created' })
	@Permissions('create', Link)
	@Post()
	async createLink(
		@Param('program_id') programId: string,
		@Param('promoter_id') promoterId: string,
		@Body() body: CreateLinkDto,
	) {
		this.logger.info('START: createLink controller');

		const result = await this.linkService.createLink(
			programId,
			promoterId,
			body,
		);

		this.logger.info('END: createLink controller');
		return { message: 'Successfully created link.', result };
	}

	/**
	 * Get all links
	 */
	@ApiResponse({ status: 200, description: 'OK' })
	@Permissions('read', Link)
	@Get()
	async getAllLinks(
		@Param('program_id') programId: string,
		@Param('promoter_id') promoterId: string,
		@Query('name') name: string,
		@Query('skip') skip: number = 0,
		@Query('take') take: number = 10,
	) {
		this.logger.info('START: getAllLinks controller');

		const result = await this.linkService.getAllLinks(
			programId,
			promoterId,
			{
				name,
			},
			{
				skip,
				take,
			},
		);

		this.logger.info('END: getAllLinks controller');
		return { message: 'Successfully fetched all links.', result };
	}

	/**
	 * Get link
	 */
	@ApiResponse({ status: 200, description: 'OK' })
	@Permissions('read', Link)
	@Get(':link_id')
	async getLink(
		@Param('program_id') programId: string,
		@Param('promoter_id') promoterId: string,
		@Param('link_id') linkId: string,
	) {
		this.logger.info('START: getLink controller');

		const result = await this.linkService.getLink(linkId);

		this.logger.info('END: getLink controller');
		return { message: `Successfully fetched link ${linkId}.`, result };
	}

	/**
	 * Delete a link
	 */
	@ApiResponse({ status: 200, description: 'OK' })
	@Permissions('delete', Link)
	@Patch(':link_id')
	async deleteALink(@Param('link_id') linkId: string) {
		this.logger.info('START: deleteALink controller');

		await this.linkService.deleteLink(linkId);

		this.logger.info('END: deleteLink controller');
		return { message: 'Successfully deleted link.' };
	}
}
