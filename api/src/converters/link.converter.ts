import { Injectable } from "@nestjs/common";
import { LinkDto } from "../dtos";
import { Link } from "../entities";

@Injectable()
export class LinkConverter {
    
    convert(link: Link): LinkDto {
        const linkDto = new LinkDto();

        linkDto.linkId = link.linkId;

        linkDto.name = link.name;
        linkDto.source = link.source;
        linkDto.medium = link.medium;

        linkDto.createdAt = link.createdAt;
        linkDto.updatedAt = link.updatedAt;

        return linkDto;
    }

}