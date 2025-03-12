import { Injectable } from '@nestjs/common';
import { LinkDto } from '../dtos';
import { Link } from '../entities';
import { LinkStatsView } from 'src/entities/link.view';
import { LinksRow, LinksTable, LinkStatsRow, LinkSummaryList, LinkWorkbook, LwLinksSheet, LwSummarySheet, PromoterInterfaceWorkbook } from 'generated/sources';
import { LinkStatsTable } from '../../generated/sources/tables/link-stats-table/LinkStatsTable';
import { LinkStatsSheet } from '../../generated/sources/sheets/link-stats-sheet/LinkStatsSheet';
import { JSONObject } from '@org.quicko/core';
import { conversionTypeEnum } from 'src/enums';
import { formatDate } from 'src/utils';

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

	getLinkStatsViewSheetRow(linkStat: LinkStatsView): LinkStatsRow {
		const linkStatsRow = new LinkStatsRow([]);

		linkStatsRow.setLinkId(linkStat.linkId);
		linkStatsRow.setLinkName(linkStat.name);
		linkStatsRow.setRefVal(linkStat.refVal);
		linkStatsRow.setPromoterId(linkStat.promoterId);
		linkStatsRow.setSignups(Number(linkStat.signups));
		linkStatsRow.setPurchases(Number(linkStat.purchases));
		linkStatsRow.setCommission(Number(linkStat.commission));
		linkStatsRow.setCreatedAt(formatDate(linkStat.createdAt));

		return linkStatsRow;
	}

	convertLinkStatsToSheet(linkStats: LinkStatsView[], metadata: {
		website: string,
		programId: string,
	}): PromoterInterfaceWorkbook {
		const linkStatsTable = new LinkStatsTable();

		linkStats.forEach((linkStat) => {
			const linkStatsRow = this.getLinkStatsViewSheetRow(linkStat);
			linkStatsTable.addRow(linkStatsRow);
		});

		linkStatsTable.metadata = new JSONObject(metadata);

		const linkStatsSheet = new LinkStatsSheet();
		linkStatsSheet.addLinkStatsTable(linkStatsTable);

		const promoterWorkbook = new PromoterInterfaceWorkbook();
		promoterWorkbook.addLinkStatsSheet(linkStatsSheet);

		return promoterWorkbook;
	}

	convertToReportWorkbook(
		links: Link[],
		startDate: Date,
		endDate: Date,
	): LinkWorkbook {
		const signUpWorkbook = new LinkWorkbook();

		const linksSheet = new LwLinksSheet();
		const linksTable = new LinksTable();
		
		const totalLinks = links.length;
		let totalSignUpsCommission = 0;
		let totalPurchasesCommission = 0;
		let totalSignUps = 0;
		let totalPurchases = 0;
		let totalRevenue = 0;

		links.forEach((link) => {
			const row = new LinksRow([]);

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
			row.setLink(link.program.website + '/?ref=' + link.refVal);
			row.setSignups(Number(signUps));
			row.setSignups(Number(signUps));
			row.setPurchases(Number(purchases));
			row.setCommissionOnSignups(Number(signUpsCommission));
			row.setCommissionOnPurchases(Number(purchasesCommission));
			row.setRevenue(Number(revenue));
			row.setTotalCommission(Number(signUpsCommission) + Number(purchasesCommission));

			linksTable.addRow(row);
		});

		linksSheet.addLinksTable(linksTable);

		const summarySheet = new LwSummarySheet();
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

		signUpWorkbook.addLwSummary(summarySheet);
		signUpWorkbook.addLwLinks(linksSheet);

		return signUpWorkbook;

	}
}
