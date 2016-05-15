export function parseDateTime(date, time): Date {
    let dateParts = date.split('.');
    let newDateString = `${dateParts[1]}/${dateParts[0]}/${dateParts[2]}`;
    return new Date(`${newDateString} ${time} GMT+0200`)
}

export function minutesBetweenDates(date1, date2): number {
    return Math.abs((date2 - date1) / (1000 * 60));
}