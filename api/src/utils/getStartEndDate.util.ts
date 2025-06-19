import { BadRequestException } from '@nestjs/common';
import { subMonths, subDays } from 'date-fns';
import { StartEndDateInterface } from '../interfaces';

export function getStartEndDate(startDate: (string | undefined), endDate: (string | undefined)): StartEndDateInterface {
    
    // by default, a 1 month report shall be generated
    if (!(startDate && endDate)) {
        return {
            parsedStartDate: subMonths(new Date(), 1),
            parsedEndDate: new Date(),
        };
    }

    else if ((!startDate || !endDate)) {
        throw new BadRequestException(`Error. Both start and end date must be provided for a custom report period`);
    }

    const defaultStartDate = subDays(new Date(), 30); // last 30 days

    // Parse startDate if provided, otherwise use default
    const parsedStartDate = startDate ? new Date(startDate) : defaultStartDate;

    const parsedEndDate = getEndDate(parsedStartDate, endDate);

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