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
		memberSheet: MemberSheet,
		{
			promoterMembers,
			promoterId,
			count,
			queryOptions
		}: IMemberSheetConverterInput
	) {
		try {
			if (!queryOptions) queryOptions = defaultQueryOptions;
			this.memberTableConverter.convertFrom(
				memberSheet.getMemberTable(),
				promoterMembers,
				promoterId,
				count,
				queryOptions
			);
		} catch (error) {
			throw new ConverterException('Failed to convert to Member Sheet', error);
		}
	}
}