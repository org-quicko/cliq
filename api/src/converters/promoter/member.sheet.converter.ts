import { LinkAnalyticsView, PromoterMember } from "../../entities";
import { LinkAnalyticsSheet, MemberSheet } from "@org-quicko/cliq-sheet-core/Promoter/beans";
import { LinkAnalyticsTableConverter } from "./link_analytics.table.converter";
import { QueryOptionsInterface } from "../../interfaces";
import { defaultQueryOptions } from "../../constants";
import { MemberTableConverter } from "./member.table.converter";
import { ConverterException } from '@org-quicko/core';

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
		{
			promoterMembers,
			promoterId,
			count,
			queryOptions
		}: IMemberSheetConverterInput
	) {
		try {
			const memberSheet = new MemberSheet();

			if (!queryOptions) queryOptions = defaultQueryOptions;

			const memberTable = this.memberTableConverter.convertFrom(
				promoterMembers,
				promoterId,
				count,
				queryOptions
			);
			memberSheet.replaceBlock(memberTable);

			return memberSheet;
			
		} catch (error) {
			throw new ConverterException('Failed to convert to Member Sheet', error);
		}
	}
}