import { Injectable } from '@nestjs/common';
import { LinkDto } from '../../dtos';
import { Link } from '../../entities';
import { ConverterException } from '@org-quicko/core';

@Injectable()
export class LinkConverter {
	convert(link: Link): LinkDto {
		try {
			const linkDto = new LinkDto();

			linkDto.linkId = link.linkId;

			linkDto.name = link.name;
			linkDto.refVal = link.refVal;

			linkDto.createdAt = new Date(link.createdAt);
			linkDto.updatedAt = new Date(link.updatedAt);

			return linkDto;
		} catch (error) {
			throw new ConverterException('Error converting Link entity to LinkDto', error);
		}
	}
}
