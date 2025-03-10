import {
	visibilityEnum,
	statusEnum,
	roleEnum,
	conversionTypeEnum,
	effectEnum,
} from 'src/enums';

export interface QueryOptionsInterface {
	name?: string;
	email?: string;
	visibility?: visibilityEnum;
	status?: statusEnum;
	role?: roleEnum;
	externalId?: string;
	itemId?: string;
	conversionType?: conversionTypeEnum;
	effect?: effectEnum;
	source?: string;
	url?: string;
	medium?: string;

	skip?: number;
	take?: number;
}
