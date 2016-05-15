let utils = require('./utils');

interface TripInfo {
    startTime: Date,
    endTime: Date,
    totalTime: number
}

export function buildTripSummaryMessage(trip): string {
    let tripInfo = buildTripInfo(trip);
    let message = `${tripInfo.startTime.toLocaleTimeString()} to ${tripInfo.endTime.toLocaleTimeString()}`;
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

export function buildTripDetailsMessage(trip): string {
    let tripInfo = buildTripInfo(trip);
    let message = `If you leave at ${tripInfo.startTime.toLocaleTimeString()} you will arrive at ${tripInfo.endTime.toLocaleTimeString()}\n\n`
    trip.Leg.forEach((leg) => {
        let startTime = utils.parseDateTime(leg.Origin.date, leg.Origin.time);
        let endTime = utils.parseDateTime(leg.Destination.date, leg.Destination.time);

        let legTime = utils.minutesBetweenDates(endTime, startTime);
        let legPrefix = ((leg.type == "WALK") ? `Walk ` : `Ride ${leg.name}`);
        message += `${legPrefix} ${legTime} minutes from ${leg.Origin.name} to ${leg.Destination.name}\n\n`;
    });
    return message;
}

function buildTripInfo(trip): TripInfo {
    let tripInfo: TripInfo = <TripInfo>{
        startTime: utils.parseDateTime(trip.Leg[0].Origin.date, trip.Leg[0].Origin.time),
        endTime: utils.parseDateTime(trip.Leg[trip.Leg.length -1].Destination.date, trip.Leg[trip.Leg.length -1].Destination.time),
        totalTime: 0
    }
    tripInfo.totalTime = utils.minutesBetweenDates(this.startTime, this.endTime); 
    return tripInfo;
}