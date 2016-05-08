var utils = require('./utils');

function buildTripSummaryMessage(trip) {
    var tripInfo = buildTripInfo(trip);
    var message = `${tripInfo.startTime.toLocaleTimeString()} to ${tripInfo.endTime.toLocaleTimeString()}`;
    // var message = `${tripInfo.startTime.toLocaleTimeString()} to ${tripInfo.endTime.toLocaleTimeString()}`;
    if (trip.Leg.length == 1 && trip.Leg[0].type == 'WALK') {
        message += ' Walk';
    } else {
        trip.Leg.forEach((leg) => {
            if (leg.type != 'WALK') {
                message += `, ${leg.name}`;
            }
        });
    }
    return message;
}

function buildTripDetailsMessage(trip) {
    var tripInfo = buildTripInfo(trip);
    var message = `If you leave at ${tripInfo.startTime.toLocaleTimeString()} you will arrive at ${tripInfo.endTime.toLocaleTimeString()}\n\n`
    trip.Leg.forEach((leg) => {
        var startTime = utils.parseDateTime(leg.Origin.date, leg.Origin.time);
        var endTime = utils.parseDateTime(leg.Destination.date, leg.Destination.time);

        var legTime = utils.minutesBetweenDates(endTime, startTime);
        var legPrefix = ((leg.type == "WALK") ? `Walk ` : `Ride ${leg.name}`);
        message += `${legPrefix} ${legTime} minutes from ${leg.Origin.name} to ${leg.Destination.name}\n\n`;
    });
    return message;
}

function buildTripInfo(trip) {
    var tripInfo  = {
        startTime: utils.parseDateTime(trip.Leg[0].Origin.date, trip.Leg[0].Origin.time),
        endTime: utils.parseDateTime(trip.Leg[trip.Leg.length -1].Destination.date, trip.Leg[trip.Leg.length -1].Destination.time),        
    }
    tripInfo.totalTime = utils.minutesBetweenDates(this.startTime, this.endTime); 
    return tripInfo;
}

module.exports = {
    buildTripDetailsMessage: buildTripDetailsMessage,
    buildTripSummaryMessage: buildTripSummaryMessage
}