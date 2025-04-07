import { Injectable } from '@nestjs/common';
import { LinkDto } from '../dtos';
import { Link } from '../entities';
import { LinkStatsView } from 'src/entities/linkStats.view';
import { JSONObject } from '@org.quicko/core';
import { conversionTypeEnum } from 'src/enums';
import { formatDate } from 'src/utils';
import { LinkStatsTable, PromoterWorkbook, LinkStatsRow, LinkStatsSheet } from 'generated/sources/Promoter';
import { LinkRow, LinkSheet, LinkSummaryList, LinkSummarySheet, LinkTable, LinkWorkbook } from 'generated/sources/Link';

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

	/** For getting link statistics sheet inside a Promoter Workbook */
	convertLinkStatsToSheet(linkStats: LinkStatsView[], metadata: {
		website: string,
		programId: string,
		count: number
	}): PromoterWorkbook {
		const linkStatsTable = new LinkStatsTable();

		linkStats.forEach((linkStat) => {
			const row = new LinkStatsRow([]);

			row.setLinkId(linkStat.linkId);
			row.setLinkName(linkStat.name);
			row.setRefVal(linkStat.refVal);
			row.setPromoterId(linkStat.promoterId);
			row.setSignups(Number(linkStat.signups));
			row.setPurchases(Number(linkStat.purchases));
			row.setCommission(Number(linkStat.commission));
			row.setCreatedAt(linkStat.createdAt.toISOString()); 
			
			linkStatsTable.addRow(row);
		});

		linkStatsTable.metadata = new JSONObject(metadata);

		const linkStatsSheet = new LinkStatsSheet();
		linkStatsSheet.addLinkStatsTable(linkStatsTable);

		const promoterWorkbook = new PromoterWorkbook();
		promoterWorkbook.addLinkStatsSheet(linkStatsSheet);

		return promoterWorkbook;
	}

	/** For getting link report inside Link Workbook */
	convertToReportWorkbook(
		links: Link[],
		startDate: Date,
		endDate: Date,
	): LinkWorkbook {
		const signUpWorkbook = new LinkWorkbook();

		const linksSheet = new LinkSheet();
		const linksTable = new LinkTable();

		const totalLinks = links.length;
		let totalSignUpsCommission = 0;
		let totalPurchasesCommission = 0;
		let totalSignUps = 0;
		let totalPurchases = 0;
		let totalRevenue = 0;

		links.forEach((link) => {
			const row = new LinkRow([]);

			let signUpsCommission = 0;
			let purchasesCommission = 0;
			let signUps = 0;
			let purchases = 0;
			let revenue = 0;

			link.commissions.forEach((commission) => {
				if (commission.conversionType === conversionTypeEnum.SIGNUP) {
					signUpsCommission += Number(commission.amount);
					signUps++;

				} else if (commission.conversionType === conversionTypeEnum.PURCHASE) {
					purchasesCommission += Number(commission.amount);
					purchases++;
					revenue += Number(commission.revenue);
				}
			});

			totalSignUps += Number(signUps);
			totalPurchases += Number(purchases);
			totalSignUpsCommission += Number(signUpsCommission);
			totalPurchasesCommission += Number(purchasesCommission);
			totalRevenue += Number(revenue);

			row.setLinkName(link.name);
			row.setLink(link.program.website + '?ref=' + link.refVal);
			row.setSignups(Number(signUps));
			row.setSignups(Number(signUps));
			row.setPurchases(Number(purchases));
			row.setCommissionOnSignups(Number(signUpsCommission));
			row.setCommissionOnPurchases(Number(purchasesCommission));
			row.setRevenue(Number(revenue));
			row.setTotalCommission(Number(signUpsCommission) + Number(purchasesCommission));

			linksTable.addRow(row);
		});

		linksSheet.addLinkTable(linksTable);

		const summarySheet = new LinkSummarySheet();
		const linksSummaryList = new LinkSummaryList();

		linksSummaryList.addFrom(formatDate(startDate));
		linksSummaryList.addTo(formatDate(endDate));
		linksSummaryList.addLinks(Number(totalLinks));
		linksSummaryList.addSignups(Number(totalSignUps));
		linksSummaryList.addCommissionOnSignups(Number(totalSignUpsCommission));
		linksSummaryList.addPurchases(Number(totalPurchases));
		linksSummaryList.addCommissionOnPurchases(Number(totalPurchasesCommission));
		linksSummaryList.addRevenue(Number(totalRevenue));
		linksSummaryList.addTotalCommission(Number(totalSignUpsCommission) + Number(totalPurchasesCommission));

		summarySheet.addLinkSummaryList(linksSummaryList);

		signUpWorkbook.addLinkSummarySheet(summarySheet);
		signUpWorkbook.addLinkSheet(linksSheet);

		return signUpWorkbook;

	}
}
