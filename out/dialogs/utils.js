"use strict";
function parseDateTime(date, time) {
    let dateParts = date.split('.');
    let newDateString = `${dateParts[1]}/${dateParts[0]}/${dateParts[2]}`;
    return new Date(`${newDateString} ${time} GMT+0200`);
}
exports.parseDateTime = parseDateTime;
function minutesBetweenDates(date1, date2) {
    return Math.abs((date2 - date1) / (1000 * 60));
}
exports.minutesBetweenDates = minutesBetweenDates;
//# sourceMappingURL=utils.js.map