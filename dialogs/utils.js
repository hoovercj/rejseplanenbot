function parseDateTime(date, time) {
    var dateParts = date.split('.');
    var newDateString = `${dateParts[1]}/${dateParts[0]}/${dateParts[2]}`;
    return new Date(`${newDateString} ${time} GMT+0200`)
}

function minutesBetweenDates(date1, date2) {
    return Math.abs((date2 - date1) / (1000 * 60));
}

module.exports = {
    parseDateTime: parseDateTime,
    minutesBetweenDates: minutesBetweenDates
}