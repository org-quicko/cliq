import { LinkAnalyticsView, PromoterMember } from "src/entities";
import { LinkAnalyticsSheet, MemberSheet } from "@org-quicko/cliq-sheet-core/Promoter/beans";
import { LinkAnalyticsTableConverter } from "./link_analytics.table.converter";
import { QueryOptionsInterface } from "src/interfaces";
import { defaultQueryOptions } from "src/constants";
import { MemberTableConverter } from "./member.table.converter";

export interface IMemberSheetConverterInput {
	promoterMembers: PromoterMember[];
	promoterId: string;
	count: number;
	queryOptions?: QueryOptionsInterface;
};

export class MemberSheetConverter {

	private memberTableConverter: MemberTableConverter;

	constructor() {
		this.memberTableConverter = new MemberTableConverter();
	}

	convertFrom(
		memberSheet: MemberSheet,
		{
			promoterMembers, 
			promoterId, 
			count, 
			queryOptions
		}: IMemberSheetConverterInput
	) {
		if (!queryOptions) queryOptions = defaultQueryOptions;

		this.memberTableConverter.convertFrom(
			memberSheet.getMemberTable(),
			promoterMembers,
			promoterId,
			count,
			queryOptions
		);
	}
}