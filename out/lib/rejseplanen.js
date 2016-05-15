"use strict";
let request = require('request-promise');
let BASE_URL = "http://xmlopen.rejseplanen.dk/bin/rest.exe/";
let FORMAT_PREFIX = "&format=json";
/**
 * PUBLIC INTERFACE
 */
function tripList(origin, destination) {
    return rejseplanenRequest('trip', buildTripOptions(origin, destination)).then((result) => {
        return result.TripList.Trip;
    });
}
exports.tripList = tripList;
function stationLocation(input) {
    return locationList(input).then((result) => {
        return result.StopLocation[0] || result.StopLocation;
    });
}
exports.stationLocation = stationLocation;
function coordinateLocation(input) {
    return locationList(input).then((result) => {
        return result.CoordLocation[0] || result.CoordLocation;
    });
}
exports.coordinateLocation = coordinateLocation;
function locationList(input) {
    // SANITIZE INPUT??
    return rejseplanenRequest('location', {
        input: input
    }).then((result) => {
        return result.LocationList;
    });
}
exports.locationList = locationList;
/**
 * PRIVATE METHODS
 */
function rejseplanenRequest(endpoint, params) {
    params.format = 'json';
    return request({
        uri: endpoint,
        baseUrl: BASE_URL,
        qs: params,
        json: true
    });
}
function buildTripOptions(origin, destination) {
    let options = {};
    Object.assign(options, origin.id ? buildTripOptionsFromId(origin, 'origin') : buildTripOptionsFromCoordinates(origin, 'origin'), destination.id ? buildTripOptionsFromId(destination, 'dest') : buildTripOptionsFromCoordinates(destination, 'dest'));
    return options;
}
function buildTripOptionsFromId(location, prefix) {
    // get station id
    if (!location) {
        return null;
    }
    else {
        let options = {};
        options[`${prefix}Id`] = `${location.id}`;
        return options;
    }
}
function buildTripOptionsFromCoordinates(location, prefix) {
    // get coords and name
    if (!location) {
        return null;
    }
    else {
        let options = {};
        options[`${prefix}CoordX`] = `${location.x}`;
        options[`${prefix}CoordY`] = `${location.y}`;
        options[`${prefix}CoordName`] = `${location.name}`;
        return options;
    }
}
//# sourceMappingURL=rejseplanen.js.map