import { Injectable } from '@nestjs/common';
import { LinkDto } from '../../dtos';
import { Link } from '../../entities';

@Injectable()
export class LinkConverter {
	convert(link: Link): LinkDto {
		const linkDto = new LinkDto();

		linkDto.linkId = link.linkId;

		linkDto.name = link.name;
		linkDto.refVal = link.refVal;

		linkDto.createdAt = new Date(link.createdAt);
		linkDto.updatedAt = new Date(link.updatedAt);

		return linkDto;
	}
}
