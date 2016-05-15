let request = require('request-promise');

// TODO: objectify this so BASE_URL can be passed in
let BASE_URL = "http://xmlopen.rejseplanen.dk/bin/rest.exe/";
let FORMAT_PREFIX = "&format=json"

/**
 * PUBLIC INTERFACE
 */
export function tripList(origin: Location, destination: Location): Promise<Trip[]> {
    return rejseplanenRequest('trip', buildTripOptions(origin, destination)).then((result) => {
        return result.TripList.Trip;
    });
}

export function stationLocation(input: string): Promise<Location> {
    return locationList(input).then((result: LocationList) => {
        return result.StopLocation[0] || result.StopLocation;
    });
}

export function coordinateLocation(input: string): Promise<Location> {
    return locationList(input).then((result: LocationList) => {
        return result.CoordLocation[0] || result.CoordLocation;
    });
}

export function locationList(input: string): Promise<LocationList> {
    // SANITIZE INPUT??
    return rejseplanenRequest('location', {
        input: input
    }).then((result) => {
        return result.LocationList;
    });
}

/**
 * PRIVATE METHODS
 */

function rejseplanenRequest(endpoint: string, params): Promise<any> {
    params.format = 'json';
    return request({
        uri: endpoint,
        baseUrl: BASE_URL,
        qs: params,
        json: true
    });
}

function buildTripOptions(origin: Location, destination: Location): TripOptions {
    let options = <TripOptions>{};
    Object.assign(
        options,
        _buildTripOptions(origin, 'origin'),
        _buildTripOptions(destination, 'dest')
    );
    return options;
}

function _buildTripOptions(location: Location, prefix: string): TripOptions {
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

// Parameters for the Trip API endpoint
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

export interface Location {
    x: number;
    y: number;
    name: string;
    type?: string;
    id?: string;
}

export interface LocationList {
    CoordLocation?: Location | Location[];
    StopLocation?: Location | Location[]
}

export interface Stop {
    name: string;
    type: string;
    routeIdx?: string;
    time: string;
    date: string;
    track?: string;
}

export interface Leg {
    name: string;
    type: string;
    Origin: Stop;
    Destination: Stop;
}

export interface Trip {
    Leg: Leg[]
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