import { Injectable } from '@nestjs/common';
import { LinkDto } from '../dtos';
import { Link } from '../entities';
import { LinkStatsView } from 'src/entities/link.view';
import { LinkStatsRow, PromoterWorkbook } from 'generated/sources';
import { LinkStatsTable } from '../../generated/sources/tables/link-stats-table/LinkStatsTable';
import { LinkStatsSheet } from '../../generated/sources/sheets/link-stats-sheet/LinkStatsSheet';

@Injectable()
export class LinkConverter {
	convert(link: Link): LinkDto {
		const linkDto = new LinkDto();

		linkDto.linkId = link.linkId;

		linkDto.refVal = link.refVal;
		linkDto.source = link.source;
		linkDto.medium = link.medium;

		linkDto.createdAt = new Date(link.createdAt);
		linkDto.updatedAt = new Date(link.updatedAt);

		return linkDto;
	}

	getLinkStatsViewSheetRow(linkStat: LinkStatsView): LinkStatsRow {
		const linkStatsRow = new LinkStatsRow([]);

		linkStatsRow.setLinkId(linkStat.linkId);
		linkStatsRow.setRefVal(linkStat.refVal);
		linkStatsRow.setPromoterId(linkStat.promoterId);
		linkStatsRow.setSignups(linkStat.signups);
		linkStatsRow.setPurchases(linkStat.purchases);
		linkStatsRow.setCommission(linkStat.commission);
		linkStatsRow.setCreatedAt(linkStat.createdAt.toISOString());

		return linkStatsRow;
	}

	convertLinkStatsToSheet(linkStats: LinkStatsView[]): PromoterWorkbook {
		const linkStatsTable = new LinkStatsTable();

		linkStats.forEach((linkStat) => {
			const linkStatsRow = this.getLinkStatsViewSheetRow(linkStat);
			linkStatsTable.addRow(linkStatsRow);
		});

		const linkStatsSheet = new LinkStatsSheet();
		linkStatsSheet.addLinkStatsTable(linkStatsTable);

		const promoterWorkbook = new PromoterWorkbook();
		promoterWorkbook.addLinkStatsSheet(linkStatsSheet);

		return promoterWorkbook;
	}
}
