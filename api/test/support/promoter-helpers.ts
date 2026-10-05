/**
 * Helpers shared by the promoter, promoter-member and link e2e specs.
 */

interface WorkbookBlock {
	name: string;
	header: string[];
	rows: unknown[][];
	metadata?: Record<string, unknown>;
}

interface Workbook {
	sheets: { name: string; blocks: WorkbookBlock[] }[];
}

/**
 * Several endpoints (link creation, member invites, the sheet-json variants
 * of the list endpoints) answer with a PromoterWorkbook: one sheet per
 * resource, each holding table blocks of `header` + positional `rows`. This
 * pulls one table out by name.
 */
export function workbookTable(body: unknown, tableName: string): WorkbookBlock {
	const workbook = body as Workbook;
	for (const sheet of workbook.sheets) {
		const block = sheet.blocks.find((b) => b.name === tableName);
		if (block) return block;
	}
	throw new Error(`workbook has no table named ${tableName}`);
}

/**
 * The rows of a workbook table as objects keyed by header. Rows may be
 * shorter than the header (trailing columns left unset), so missing cells
 * come back `undefined`.
 */
export function workbookRows(
	body: unknown,
	tableName: string,
): Record<string, unknown>[] {
	const { header, rows } = workbookTable(body, tableName);
	return rows.map((row) =>
		Object.fromEntries(header.map((column, i) => [column, row[i]])),
	);
}
