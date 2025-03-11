import { BadRequestException } from '@nestjs/common';
import { subMonths, subWeeks, startOfWeek, startOfMonth, subDays } from 'date-fns';
import { reportPeriodEnum } from '../enums/reportPeriod.enum';

interface StartEndDateInterface {
    parsedStartDate: Date | undefined;
    parsedEndDate: Date | undefined;
}

export function getStartEndDate(startDate: (string | undefined), endDate: (string | undefined), reportPeriod?: reportPeriodEnum): StartEndDateInterface {
    
    if (!reportPeriod && !(startDate && endDate)) {
        return {
            parsedStartDate: undefined,
            parsedEndDate: undefined,
        };
    }

    if (reportPeriod) {
        return getPeriodStartEndDate(reportPeriod);
    }

    const defaultStartDate = subMonths(new Date(), 1); // One month ago

    // Parse startDate if provided, otherwise use default
    const parsedStartDate = startDate ? new Date(startDate) : defaultStartDate;

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
            parsedStartDate = startOfWeek(parsedEndDate);
            break;
        case reportPeriodEnum.THIS_MONTH:
            parsedStartDate = startOfMonth(parsedEndDate);
            break;
        case reportPeriodEnum.LAST_7_DAYS:
            parsedStartDate = subWeeks(parsedEndDate, 1);
            break;
            case reportPeriodEnum.LAST_30_DAYS:
            parsedStartDate = subDays(parsedEndDate, 30);
            break;
            case reportPeriodEnum.LAST_90_DAYS:
            parsedStartDate = subDays(parsedEndDate, 90);
            break;
        default:
            throw new BadRequestException(`Incorrect report period passed.`);
    }

    return {
        parsedStartDate,
        parsedEndDate,
    };

}

function getEndDate(parsedStartDate: Date, endDate: (string | undefined)) {
    if (isNaN(parsedStartDate.getTime())) {
        throw new BadRequestException('Invalid start date format.');
    }
    
    // Parse endDate if provided, otherwise default to today
    const parsedEndDate = endDate ? new Date(endDate) : new Date();
    if (isNaN(parsedEndDate.getTime())) {
        throw new BadRequestException('Invalid end date format.');
    }
    
    // Ensure startDate is before endDate
    if (parsedStartDate > parsedEndDate) {
        throw new BadRequestException('Start date must be before End date.');
    }

    return parsedEndDate;
}