import * as utils from'./utils';

import { Trip } from '../lib/rejseplanen';

interface TripInfo {
    startTime: Date,
    endTime: Date,
    totalTime: number
}

export function buildTripSummaryMessage(trip: Trip): string {
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

export function buildTripDetailsMessage(trip: Trip): string {
    let tripInfo = buildTripInfo(trip);
    let message = `If you leave at ${tripInfo.startTime.toLocaleTimeString()} you will arrive at ${tripInfo.endTime.toLocaleTimeString()}\n\n`
    trip.Leg.forEach((leg) => {
        let startTime = utils.parseRejseplanenDateTime(leg.Origin.date, leg.Origin.time);
        let endTime = utils.parseRejseplanenDateTime(leg.Destination.date, leg.Destination.time);
        let legTime = utils.minutesBetweenDates(endTime, startTime);
        let legPrefix = ((leg.type == "WALK") ? `Walk ` : `Ride ${leg.name}`);
        message += `${legPrefix} ${legTime} minutes from ${leg.Origin.name} to ${leg.Destination.name}\n\n`;
    });
    return message;
}

function buildTripInfo(trip: Trip): TripInfo {
    let tripInfo: TripInfo = <TripInfo>{
        startTime: utils.parseRejseplanenDateTime(trip.Leg[0].Origin.date, trip.Leg[0].Origin.time),
        endTime: utils.parseRejseplanenDateTime(trip.Leg[trip.Leg.length -1].Destination.date, trip.Leg[trip.Leg.length -1].Destination.time),
        totalTime: 0
    }
    tripInfo.totalTime = utils.minutesBetweenDates(tripInfo.startTime, tripInfo.endTime); 
    return tripInfo;
}