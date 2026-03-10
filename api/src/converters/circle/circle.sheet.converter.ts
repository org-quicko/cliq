import { CircleSheet } from '@org-quicko/cliq-sheet-core/Circle/beans';
import { ConverterException } from '@org-quicko/core';
import { CircleTableConverter, ICircleTableInput } from './circle.table.converter';

export interface ICircleSheetConverterInput {
	circles: ICircleTableInput[];
}

export class CircleSheetConverter {
	private circleTableConverter: CircleTableConverter;

	constructor() {
		this.circleTableConverter = new CircleTableConverter();
	}

	convertFrom({ circles }: ICircleSheetConverterInput) {
		try {
			const circleSheet = new CircleSheet();

			const circleTable = this.circleTableConverter.convertFrom(circles);
			circleSheet.replaceBlock(circleTable);

			return circleSheet;
		} catch (error) {
			throw new ConverterException('Failed to convert to Circle Sheet', error);
		}
	}
}
