// Written by Microsoft
var builder = require('botbuilder');
var prompts = require('../prompts');

// External Libraries
var rejseplanen = require('../lib/rejseplanen');

// My Helpers
var utils = require('./utils');
var messageBuilder = require('./messageBuilder')

/** Return a LuisDialog that points at our model and then add intent handlers. */
var model = process.env.model || 'https://api.projectoxford.ai/luis/v1/application?id=742c073a-d51f-4353-b716-44a0e1ae9cf2&subscription-key=8f0caa5b20404008856c4f41d1945651';
var dialog = new builder.LuisDialog(model);
module.exports = dialog;

/** Answer users help requests. We can use a DialogAction to send a static message. */
dialog.on('None', builder.DialogAction.send(prompts.helpMessage));

dialog.on('error', function(message) {
    console.log(message);
});

/** Prompts a user for the title of the task and saves it.  */
dialog.on('FindRoute', [
    function (session, args, next) {
        // See if got the tasks title from our LUIS model.
        var luisLocations = sortLocations(args); 
        if (luisLocations.length != 2) {
            // TODO: Do something better
            session.send(prompts.routeRequestNotUnderstood);    
        } else { 
            var originLuisLocation = luisLocations[0];
            var destinationLuisLocation = luisLocations[1];
            var originRejseplanenLocation;
            var destinationRejseplanenLocation;

            getRejseplanenLocation(originLuisLocation).then((location) => {
                originRejseplanenLocation = location;
                return getRejseplanenLocation(destinationLuisLocation);
            }).then((location) => {
                destinationRejseplanenLocation = location;
                return rejseplanen.tripList(originRejseplanenLocation, destinationRejseplanenLocation);
            }).then((tripList) => {
                session.userData.tripList = tripList;
                var prompt = `I found ${tripList.length} routes from ${originRejseplanenLocation.name} to ${destinationRejseplanenLocation.name}. Which one do you want the details for?`;
                var options = tripList.map(messageBuilder.buildTripSummaryMessage);
                builder.Prompts.choice(session, prompt, options);
            }).catch((error) => {
                session.send(`An error Occurred. Error message:\n\n${error}`);
            });
        }
    }, function(session, results) {
        session.send(messageBuilder.buildTripDetailsMessage(session.userData.tripList[results.response.index - 1]));
    }
]);

function getRejseplanenLocation(luisLocation) {
    return (luisLocation.type == "location::station" ? rejseplanen.stationLocation(luisLocation.entity) : rejseplanen.coordinateLocation(luisLocation.entity));
}

function sortLocations(args) {
    var locations = builder.EntityRecognizer.findAllEntities(args.entities, 'location::address').concat(builder.EntityRecognizer.findAllEntities(args.entities, 'location::station')); 
    var sortedLocations = locations.sort(function(a,b) {return (a.startIndex > b.startIndex) ? 1 : ((b.last_nom > a.last_nom) ? -1 : 0);} );
    return sortedLocations;
}

function buildTripMessage(trip) {
    var route = trip[0];
    var routeInfo = {};
    
    routeInfo.startTime = utils.parseDateTime(route.Leg[0].Origin.date, route.Leg[0].Origin.time);
    routeInfo.endTime = utils.parseDateTime(route.Leg[route.Leg.length -1].Destination.date, route.Leg[route.Leg.length -1].Destination.time);
    routeInfo.totalTime = utils.minutesBetweenDates(routeInfo.startTime, routeInfo.endTime);
    
    var message = `If you leave at ${routeInfo.startTime.getHours()}:${routeInfo.startTime.getMinutes()} you will arrive at ${routeInfo.endTime.getHours()}:${routeInfo.endTime.getMinutes()}\n\n`
    route.Leg.forEach((leg) => {
        var startTime = utils.parseDateTime(leg.Origin.date, leg.Origin.time);
        var endTime = utils.parseDateTime(leg.Destination.date, leg.Destination.time);

        var legTime = utils.minutesBetweenDates(endTime, startTime);
        var legPrefix = ((leg.type == "WALK") ? `Walk ` : `Ride ${leg.name}`);
        message += `${legPrefix} ${legTime} minutes from ${leg.Origin.name} to ${leg.Destination.name}\n\n`;
    });
    return message;
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