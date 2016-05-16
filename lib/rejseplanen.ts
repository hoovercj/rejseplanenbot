let request = require('request-promise');
let FORMAT_PREFIX = "&format=json"
import { IRouteProvider, RouteList, Route, LuisLocation } from './interfaces';

export class RejseplanenRoutesProvider implements IRouteProvider {

    private BASE_URL: string;

    constructor(public baseUrl) {
        this.BASE_URL = baseUrl;
    }

    getRoutes = (originLuisLocation: LuisLocation, destinationLuisLocation: LuisLocation): Promise<RouteList> => {
        let originRejseplanenLocation;
        let destinationRejseplanenLocation;
        return this.getRejseplanenLocation(originLuisLocation).then((location) => {
            originRejseplanenLocation = location;
            return this.getRejseplanenLocation(destinationLuisLocation);
        }).then((location) => {
            destinationRejseplanenLocation = location;
            return this.tripList(originRejseplanenLocation, destinationRejseplanenLocation);
        }).then((trips) => {
            return this.buildRouteList(originRejseplanenLocation.name, destinationRejseplanenLocation.name, trips);
        });
    }

    private buildRouteList = (origin: string, destination: string, trips: Trip[]): RouteList => {
        return <RouteList> {
            origin: origin,
            destination: destination,
            routes: trips.map((trip) => {
                return <Route>{
                    summary: this.buildTripSummaryMessage(trip),
                    details: this.buildTripDetailsMessage(trip)
                };
            })
        }
    }

    private getRejseplanenLocation = (luisLocation) => {
        return (luisLocation.type == "location::station" ? this.stationLocation(luisLocation.entity) : this.coordinateLocation(luisLocation.entity));
    }


    private tripList = (origin: Location, destination: Location): Promise<Trip[]> => {
        return this.rejseplanenRequest('trip', this.buildTripOptions(origin, destination)).then((result) => {
            return result.TripList.Trip;
        });
    }

    private stationLocation = (input: string): Promise<Location> => {
        return this.locationList(input).then((result: LocationList) => {
            return result.StopLocation[0] || result.StopLocation;
        });
    }

    private coordinateLocation = (input: string): Promise<Location> => {
        return this.locationList(input).then((result: LocationList) => {
            return result.CoordLocation[0] || result.CoordLocation;
        });
    }

    private locationList = (input: string): Promise<LocationList> => {
        // SANITIZE INPUT??
        return this.rejseplanenRequest('location', {
            input: input
        }).then((result) => {
            return result.LocationList;
        });
    }

    private rejseplanenRequest = (endpoint: string, params): Promise<any> => {
        params.format = 'json';
        return request({
            uri: endpoint,
            baseUrl: this.BASE_URL,
            qs: params,
            json: true
        });
    }

    private buildTripOptions = (origin: Location, destination: Location): TripOptions => {
        let options = <TripOptions>{};
        Object.assign(
            options,
            this._buildTripOptions(origin, 'origin'),
            this._buildTripOptions(destination, 'dest')
        );
        return options;
    }

    private _buildTripOptions = (location: Location, prefix: string): TripOptions => {
        // get coords and name
        if (!location || !prefix) {
            return null;
        } else if (location.id){
            let options = <TripOptions>{};
            options[`${prefix}Id`] = `${location.id}`;
            return options;
        } else if (location.x && location.y && location.name){
            let options = <TripOptions>{};
            options[`${prefix}CoordX`] = `${location.x}`;
            options[`${prefix}CoordY`] = `${location.y}`;
            options[`${prefix}CoordName`] = `${location.name}`;
            return options;
        }
    }

    private buildTripSummaryMessage = (trip: Trip): string => {
        let tripInfo = this.buildTripInfo(trip);
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

    private buildTripDetailsMessage = (trip: Trip): string => {
        let tripInfo = this.buildTripInfo(trip);
        let message = `If you leave at ${tripInfo.startTime.toLocaleTimeString()} you will arrive at ${tripInfo.endTime.toLocaleTimeString()}\n\n`
        trip.Leg.forEach((leg) => {
            let startTime = this.parseDateTime(leg.Origin.date, leg.Origin.time);
            let endTime = this.parseDateTime(leg.Destination.date, leg.Destination.time);
            let legTime = this.minutesBetweenDates(endTime, startTime);
            let legPrefix = ((leg.type == "WALK") ? `Walk ` : `Ride ${leg.name}`);
            message += `${legPrefix} ${legTime} minutes from ${leg.Origin.name} to ${leg.Destination.name}\n\n`;
        });
        return message;
    }

    private buildTripInfo = (trip: Trip): TripInfo => {
        let tripInfo: TripInfo = <TripInfo>{
            startTime: this.parseDateTime(trip.Leg[0].Origin.date, trip.Leg[0].Origin.time),
            endTime: this.parseDateTime(trip.Leg[trip.Leg.length -1].Destination.date, trip.Leg[trip.Leg.length -1].Destination.time),
            totalTime: 0
        }
        tripInfo.totalTime = this.minutesBetweenDates(tripInfo.startTime, tripInfo.endTime); 
        return tripInfo;
    }

    private parseDateTime = (date: string, time: string): Date => {
        if (!date || !time) {
            return null;
        }

        let dateParts = date.split('.');
        if (!dateParts || dateParts.length != 3) {
            return null;
        }

        let newDateString = `${dateParts[1]}/${dateParts[0]}/${dateParts[2]}`;
        return new Date(`${newDateString} ${time} GMT+0200`);
    }



    private minutesBetweenDates = (date1, date2): number => {
        return Math.abs((date2 - date1) / (1000 * 60));
    }
}

interface TripOptionalOptions {
    useTog?: number;
    useBus?: number;
    useMetro?: number;
}

interface TripOriginOptions {
    originCoordX?: string;
    originCoordY?: string;
    originCoordName?: string;
    originId?: string;
}

interface TripDestinationOptions {
    destCoordX?: string;
    destCoordY?: string;
    destCoordName?: string;
    originId?: string;
}


interface TripOptions extends 
    TripOptionalOptions, TripOriginOptions, TripDestinationOptions {
        format: string;
    }

interface Location {
    x: number;
    y: number;
    name: string;
    type?: string;
    id?: string;
}

interface LocationList {
    CoordLocation?: Location | Location[];
    StopLocation?: Location | Location[]
}

interface Stop {
    name: string;
    type: string;
    routeIdx?: string;
    time: string;
    date: string;
    track?: string;
}

interface Leg {
    name: string;
    type: string;
    Origin: Stop;
    Destination: Stop;
}

interface Trip {
    Leg: Leg[]
}

interface TripInfo {
    startTime: Date,
    endTime: Date,
    totalTime: number
}

// TripList
//     Trip[]
//         isCancelled
//         Leg[]
//             name
//             type
//             Origin
//                 name
//                 type
//                 time
//                 date
//             Destination
//                 name
//                 type
//                 time
//                 date