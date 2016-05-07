var builder = require('botbuilder');
var prompts = require('../prompts');
var request = require('request-promise');

var BASE_REJSEPLANEN_URL = "http://xmlopen.rejseplanen.dk/bin/rest.exe/";
var FORMAT = "&format=json"
/** Return a LuisDialog that points at our model and then add intent handlers. */
var model = process.env.model || 'https://api.projectoxford.ai/luis/v1/application?id=742c073a-d51f-4353-b716-44a0e1ae9cf2&subscription-key=8f0caa5b20404008856c4f41d1945651';
var dialog = new builder.LuisDialog(model);
module.exports = dialog;

/** Answer users help requests. We can use a DialogAction to send a static message. */
dialog.on('None', builder.DialogAction.send(prompts.helpMessage));

/** Prompts a user for the title of the task and saves it.  */
dialog.on('FindRoute', [
    function (session, args, next) {
        // See if got the tasks title from our LUIS model.
        var locations = sortLocations(args); 
        if (locations.length != 2) {
            // TODO: Do something better
            session.send(prompts.routeRequestNotUnderstood);    
        } else {
            
            session.userData.originLocationLuis = locations[0];
            session.userData.destinationLocationLuis = locations[1];
            var originLocationParams = buildLocationParams(locations[0].entity);
            var destinationLocationParams = buildLocationParams(locations[1].entity);
            rejseplanenRequest(originLocationParams).then((result) => {
                session.userData.originLocationResults = result.LocationList;
            }).then(() => {
                return rejseplanenRequest(destinationLocationParams).then((result) => {
                    session.userData.destinationLocationResults = result.LocationList;
                });
            }).then(() => {
                var originType = session.userData.originLocationLuis.type;
                var originList = session.userData.originLocationResults;
                var destinationType = session.userData.destinationLocationLuis.type;
                var destinationList = session.userData.destinationLocationResults;
                
                var routeParams = 'trip/?' + buildRouteParams(originType, originList, 'origin') + buildRouteParams(destinationType, destinationList, 'dest');

                return rejseplanenRequest(routeParams).then((result) => {
                    session.userData.routeInfo = result;
                });
            }).then(() => {
                session.send(buildTripMessage(session.userData.routeInfo.TripList.Trip));
            });
        }
    }
]);

function sortLocations(args) {
    var locations = builder.EntityRecognizer.findAllEntities(args.entities, 'location::address').concat(builder.EntityRecognizer.findAllEntities(args.entities, 'location::station')); 
    var sortedLocations = locations.sort(function(a,b) {return (a.startIndex > b.startIndex) ? 1 : ((b.last_nom > a.last_nom) ? -1 : 0);} );
    return sortedLocations;
}

function buildRouteParams(type, locationList, prefix) {
    if (type == "location::station") {
        return buildRouteParamsForStation(locationList, prefix);
    } else {
        return buildRouteParamsForCoordinates(locationList, prefix);
    }
}

function buildRouteParamsForStation(locationList, prefix) {
    // get station id
    if (!locationList.StopLocation) {
        return null;
    } else {
        var location = locationList.StopLocation[0] || locationList.StopLocation;
        return `&${prefix}Id=${location.id}`;
    }
}

function buildRouteParamsForCoordinates(locationList, prefix) {
    // get coords and name
    if (!locationList.CoordLocation) {
        return null;
    } else {
        var location = locationList.CoordLocation[0] || locationList.CoordLocation;
        return `&${prefix}CoordX=${location.x}&${prefix}CoordY=${location.y}&${prefix}CoordName=${location.name}`;
    }
}

function buildLocationParams(location) {
    // SANITIZE KTHX
    return "location?input=" + location;
}

function rejseplanenRequest(params) {
    return request({
        uri: BASE_REJSEPLANEN_URL + params + FORMAT,
        json: true
    });
}

function buildTripMessage(trip) {
    var route = trip[0];
    var routeInfo = {};
    
    routeInfo.startTime = parseDateTime(route.Leg[0].Origin.date, route.Leg[0].Origin.time);
    routeInfo.endTime = parseDateTime(route.Leg[route.Leg.length -1].Destination.date, route.Leg[route.Leg.length -1].Destination.time);
    routeInfo.totalTime = minutesBetweenDates(routeInfo.startTime, routeInfo.endTime);
    
    var message = `If you leave at ${routeInfo.startTime.getHours()}:${routeInfo.startTime.getMinutes()} you will arrive at ${routeInfo.endTime.getHours()}:${routeInfo.endTime.getMinutes()}\n`
    route.Leg.forEach((leg) => {
        var startTime = parseDateTime(leg.Origin.date, leg.Origin.time);
        var endTime = parseDateTime(leg.Destination.date, leg.Destination.time);

        var legTime = minutesBetweenDates(endTime, startTime);
        var legPrefix = ((leg.type == "WALK") ? `Walk ` : `Ride ${leg.name}`);
        message += `${legPrefix} ${legTime} minutes from ${leg.Origin.name} to ${leg.Destination.name}\n`;
    });
    return message;
}

function parseDateTime(date, time) {
    var dateParts = date.split('.');
    var newDateString = `${dateParts[1]}/${dateParts[0]}/${dateParts[2]}`;
    return new Date(`${newDateString} ${time} GMT+0200`)
}

function minutesBetweenDates(date1, date2) {
    return Math.abs((date2 - date1) / (1000 * 60));
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