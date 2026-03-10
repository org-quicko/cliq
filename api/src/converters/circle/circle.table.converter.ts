import { CircleRow, CircleTable } from '@org-quicko/cliq-sheet-core/Circle/beans';
import { ConverterException } from '@org-quicko/core';
import { Circle } from '../../entities';

export interface ICircleTableInput {
	circle: Circle;
	numberOfPromoters: number;
}

export class CircleTableConverter {
	convertFrom(circles: ICircleTableInput[]) {
		try {
			const table = new CircleTable();

			circles.forEach((data) => {
				const row = new CircleRow([]);

				row.setCircleId(String(data.circle.circleId));
				row.setName(String(data.circle.name));
				row.setNumberOfPromoters(Number(data.numberOfPromoters ?? 0));
				row.setIsDefaultCircle(Boolean(data.circle.isDefaultCircle));

				table.addRow(row);
			});

			return table;
		} catch (error) {
			throw new ConverterException('Failed to convert to Circle Table', error);
		}
	}
}
