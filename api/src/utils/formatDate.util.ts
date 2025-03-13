import { dateFormatEnum } from 'src/enums';

export function formatDate(date: Date, format: dateFormatEnum = dateFormatEnum.DD_MM_YYYY): string {

    const formatter = new Intl.DateTimeFormat('en-US', { day: '2-digit', month: '2-digit', year: '2-digit' });
    
    let fullDateString = formatter.format(date);
    const [month, dateNum, year] = fullDateString.split('/');
    
    if (format === dateFormatEnum.DD_MM_YYYY) {
        fullDateString = `${dateNum}-${month}-${year}`;

    } else if (format === dateFormatEnum.MM_DD_YYYY) {
        fullDateString = `${month}-${dateNum}-${year}`

    } else {
        fullDateString = `${year}-${month}-${dateNum}`;
    }

    return fullDateString;
}