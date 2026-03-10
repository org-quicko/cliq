import { CircleWorkbook } from '@org-quicko/cliq-sheet-core/Circle/beans';
import { Injectable } from '@nestjs/common';
import { ConverterException, JSONObject, LoggerFactory } from '@org-quicko/core';
import winston from 'winston';
import { CircleSheetConverter } from './circle.sheet.converter';
import { ICircleTableInput } from './circle.table.converter';

@Injectable()
export class CircleWorkbookConverter {
	private logger: winston.Logger = LoggerFactory.getLogger(CircleWorkbookConverter.name);
	private circleSheetConverter: CircleSheetConverter;

	constructor() {
		this.circleSheetConverter = new CircleSheetConverter();
	}

	convert(
		circles: ICircleTableInput[],
		skip: number,
		take: number,
		totalCount: number,
	) {
		try {
			this.logger.info('START: convert function: CircleWorkbookConverter');

			const workbook = new CircleWorkbook();

			const sheet = this.circleSheetConverter.convertFrom({ circles });
			workbook.replaceSheet(sheet);

			workbook.setMetadata(new JSONObject({
				skip,
				take,
				total: totalCount,
			}));

			this.logger.info('END: convert function: CircleWorkbookConverter');
			return workbook;
		} catch (error) {
			this.logger.error('Error in CircleWorkbookConverter:', error);
			throw new ConverterException('Error converting circle data to workbook', error);
		}
	}
}
