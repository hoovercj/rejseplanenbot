"use strict";
// Written by Microsoft
let builder = require('botbuilder');
let prompts = require('../prompts');
// External Libraries
const rejseplanen = require('../lib/rejseplanen');
// My Helpers
const utils = require('./utils');
const messageBuilder = require('./messageBuilder');
/** Return a LuisDialog that points at our model and then add intent handlers. */
let model = process.env.model || 'https://api.projectoxford.ai/luis/v1/application?id=742c073a-d51f-4353-b716-44a0e1ae9cf2&subscription-key=8f0caa5b20404008856c4f41d1945651';
let dialog = new builder.LuisDialog(model);
module.exports = dialog;
/** Answer users help requests. We can use a DialogAction to send a static message. */
dialog.on('None', function (session) {
    console.log('Intent Triggered: None');
    session.send(prompts.helpMessage);
    // builder.DialogAction.send(prompts.helpMessage);
});
dialog.on('error', function (message) {
    console.error(message);
});
/** Prompts a user for the title of the task and saves it.  */
dialog.on('FindRoute', [
    function (session, args, next) {
        console.log('Intent Triggered: FindRoute');
        // See if got the tasks title from our LUIS model.
        let luisLocations = sortLocations(args);
        if (luisLocations.length != 2) {
            // TODO: Do something better
            console.log('FindRoute: Did not find 2 locations');
            session.send(prompts.routeRequestNotUnderstood);
        }
        else {
            let originLuisLocation = luisLocations[0];
            let destinationLuisLocation = luisLocations[1];
            let originRejseplanenLocation;
            let destinationRejseplanenLocation;
            console.log(`Found ${originLuisLocation.entity} and ${destinationLuisLocation.entity}`);
            getRejseplanenLocation(originLuisLocation).then((location) => {
                originRejseplanenLocation = location;
                return getRejseplanenLocation(destinationLuisLocation);
            }).then((location) => {
                destinationRejseplanenLocation = location;
                return rejseplanen.tripList(originRejseplanenLocation, destinationRejseplanenLocation);
            }).then((tripList) => {
                session.userData.tripList = tripList;
                let prompt = `I found ${tripList.length} routes from ${originRejseplanenLocation.name} to ${destinationRejseplanenLocation.name}. Which one do you want the details for?`;
                let options = tripList.map(messageBuilder.buildTripSummaryMessage);
                builder.Prompts.choice(session, prompt, options);
            }).catch((error) => {
                session.send(`An error Occurred. Error message:\n\n${error}`);
            });
        }
    }, function (session, results) {
        if (results.response) {
            console.log(`User Choice: ${results.response.index}`);
            session.send(messageBuilder.buildTripDetailsMessage(session.userData.tripList[results.response.index - 1]));
        }
        else {
            session.send("I didn't understand. Please ask me again.");
            console.log('Ending waterfall with no response.');
        }
    }
]);
function getRejseplanenLocation(luisLocation) {
    return (luisLocation.type == "location::station" ? rejseplanen.stationLocation(luisLocation.entity) : rejseplanen.coordinateLocation(luisLocation.entity));
}
function sortLocations(args) {
    let locations = builder.EntityRecognizer.findAllEntities(args.entities, 'location::address').concat(builder.EntityRecognizer.findAllEntities(args.entities, 'location::station'));
    let sortedLocations = locations.sort(function (a, b) { return (a.startIndex > b.startIndex) ? 1 : ((b.last_nom > a.last_nom) ? -1 : 0); });
    return sortedLocations;
}
function buildTripMessage(trip) {
    let route = trip[0];
    let routeInfo = {};
    routeInfo.startTime = utils.parseDateTime(route.Leg[0].Origin.date, route.Leg[0].Origin.time);
    routeInfo.endTime = utils.parseDateTime(route.Leg[route.Leg.length - 1].Destination.date, route.Leg[route.Leg.length - 1].Destination.time);
    routeInfo.totalTime = utils.minutesBetweenDates(routeInfo.startTime, routeInfo.endTime);
    let message = `If you leave at ${routeInfo.startTime.getHours()}:${routeInfo.startTime.getMinutes()} you will arrive at ${routeInfo.endTime.getHours()}:${routeInfo.endTime.getMinutes()}\n\n`;
    route.Leg.forEach((leg) => {
        let startTime = utils.parseDateTime(leg.Origin.date, leg.Origin.time);
        let endTime = utils.parseDateTime(leg.Destination.date, leg.Destination.time);
        let legTime = utils.minutesBetweenDates(endTime, startTime);
        let legPrefix = ((leg.type == "WALK") ? `Walk ` : `Ride ${leg.name}`);
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
//# sourceMappingURL=index.js.map