import { reportPeriodEnum } from "src/enums/reportPeriod.enum";

export function getReportFileName(resourceName: string, reportPeriod?: reportPeriodEnum, startDate?: Date, endDate?: Date) {
    console.log(startDate?.toDateString());
    const periodString = reportPeriod
        ? reportPeriod
        : (
            (startDate && endDate)
                ? `(${startDate.toDateString()}) to (${endDate.toDateString()})`
                : `all`
        );

    return `"${periodString} ${resourceName}_${Date.now()}.xlsx"`;
}