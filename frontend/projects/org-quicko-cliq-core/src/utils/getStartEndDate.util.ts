import moment from "moment";
import { reportPeriodEnum, StartEndDateInterface } from "../public-api";

export function getStartEndDate(startDate: (string | undefined), endDate: (string | undefined), reportPeriod?: reportPeriodEnum): StartEndDateInterface {

	// by default, a 1 month report shall be generated
	if (!reportPeriod && !(startDate && endDate)) {
		return {
			parsedStartDate: moment().subtract(30, 'days').toDate(),
			parsedEndDate: moment().toDate(),
		};
	}

	if (reportPeriod && reportPeriod !== reportPeriodEnum.CUSTOM) {
		return getPeriodStartEndDate(reportPeriod);
	}

	const defaultStartDate = moment().subtract(30, 'days').toDate(); // last 30 days

	// Parse startDate if provided, otherwise use default
	const parsedStartDate = startDate ? moment(startDate).toDate() : defaultStartDate;

	const parsedEndDate = getEndDate(parsedStartDate, endDate);

	return {
		parsedStartDate,
		parsedEndDate,
	};
}

function getPeriodStartEndDate(reportPeriod: reportPeriodEnum): StartEndDateInterface {

	let parsedStartDate: Date;
	const parsedEndDate = new Date();

	switch (reportPeriod) {
		case reportPeriodEnum.THIS_WEEK:
			// parsedStartDate = startOfWeek(parsedEndDate);
			parsedStartDate = moment(parsedEndDate).startOf('week').toDate();
			break;
		case reportPeriodEnum.THIS_MONTH:
			parsedStartDate = moment(parsedEndDate).startOf('month').toDate();
			break;
		case reportPeriodEnum.LAST_7_DAYS:
			parsedStartDate = moment(parsedEndDate).subtract(1, 'week').toDate();
			break;
		case reportPeriodEnum.LAST_30_DAYS:
			parsedStartDate = moment(parsedEndDate).subtract(30, 'days').toDate();
			break;
		case reportPeriodEnum.LAST_90_DAYS:
			parsedStartDate = moment(parsedEndDate).subtract(90, 'days').toDate();
			break;
		default:
			throw new Error(`Incorrect report period passed.`);
	}

	return {
		parsedStartDate,
		parsedEndDate,
	};

}

function getEndDate(parsedStartDate: Date, endDate: (string | undefined)) {
	if (isNaN(parsedStartDate.getTime())) {
		throw new Error('Invalid start date format.');
	}

	// Parse endDate if provided, otherwise default to today
	const parsedEndDate = endDate ? new Date(endDate) : new Date();
	if (isNaN(parsedEndDate.getTime())) {
		throw new Error('Invalid end date format.');
	}

	// Ensure startDate is before endDate
	if (parsedStartDate > parsedEndDate) {
		throw new Error('Start date must be before End date.');
	}

	return parsedEndDate;
}
