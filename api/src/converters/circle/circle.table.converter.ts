import { CircleRow, CircleTable } from '@org-quicko/cliq-sheet-core/Circle/beans';
import { ConverterException } from '@org-quicko/core';
import { Circle } from '../../entities';

export class CircleTableConverter {
	convertFrom(circles: Circle[]) {
		try {
			const table = new CircleTable();

			circles.forEach((circle) => {
				const row = new CircleRow([]);

				row.setCircleId(circle.circleId);
				row.setName(circle.name);
				row.setNumberOfPromoters(circle.circlePromoters?.length ?? 0);
				row.setIsDefaultCircle(circle.isDefaultCircle);

				table.addRow(row);
			});

			return table;
		} catch (error) {
			throw new ConverterException('Failed to convert to Circle Table', error);
		}
	}
}
