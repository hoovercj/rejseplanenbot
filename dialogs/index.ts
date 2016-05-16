// Written by Microsoft
let builder = require('botbuilder');
let prompts = require('../prompts');

import { IRouteProvider, RouteList, Route, LuisLocation } from '../lib/interfaces';
import { RejseplanenRoutesProvider } from '../lib/rejseplanen';
import { GoogleMapsRoutesProvider } from '../lib/googlemaps';
let googleProvider: IRouteProvider = new GoogleMapsRoutesProvider({key: process.env.GOOGLE_MAPS_KEY});
let rejseplanenProvider: IRouteProvider = new RejseplanenRoutesProvider(process.env.REJSEPLANEN_BASE_URL);
// let routeProvider = googleProvider;

/** Return a LuisDialog that points at our model and then add intent handlers. */
let model = process.env.LUIS_AI_MODEL
let luisDialog = new builder.LuisDialog(model);
module.exports = luisDialog;


/** Answer users help requests. We can use a DialogAction to send a static message. */
// luisDialog.on('None', function(session) {
//     console.log('Intent Triggered: None')
//     session.send(prompts.helpMessage);
// });
luisDialog.onDefault((session) => {
    if (session.message.text.toLowerCase().indexOf('google') != -1) {
        session.userData.routeProvider = googleProvider;
        session.send("Ok, I'll use google.");
    } else if (session.message.text.toLowerCase().indexOf('rejseplanen') != -1) {
        session.userData.routeProvider = rejseplanenProvider;
        session.send("Ok, I'll use rejseplanen.")
    } else {
        session.send(prompts.helpMessage);
    }
});


luisDialog.on('error', function(message) {
    console.error(message);
});

/** Prompts a user for the title of the task and saves it.  */
luisDialog.on('FindRoute', [
    function (session, args, next) {
        console.log('Intent Triggered: FindRoute');
        
        // See if got the tasks title from our LUIS model.
        let luisLocations = sortLocations(args); 
        if (luisLocations.length != 2) {
            // TODO: Do something better
            console.log('FindRoute: Did not find 2 locations')
            session.send(prompts.routeRequestNotUnderstood);
        } else {
            let originLuisLocation = luisLocations[0];
            let destinationLuisLocation = luisLocations[1];
            console.log(`Found ${originLuisLocation.entity} and ${destinationLuisLocation.entity}`);
            (session.userData.routeProvider || googleProvider)
            let provider = googleProvider;
            if (session.userData && session.userData.routeProvider) {
                provider = session.userData.routeProvider;
            }
            provider.getRoutes(originLuisLocation, destinationLuisLocation)
            .then((routeList) => {
                if (!routeList || !routeList.routes || routeList.routes.length == 0) {
                    console.log('Issue with route list. Undefined, null, or empty.');
                    session.send("I'm sorry, I found no routes for you.");
                } else if (routeList.routes.length == 1) {
                    console.log('Found 1 route. ' + routeList.routes[0].details);
                    session.send(routeList.routes[0].details);
                } else {
                    console.log('Found multiple routes');
                    session.userData.routeList = routeList;
                    let prompt = `I found ${routeList.routes.length} routes from ${routeList.origin} to ${routeList.destination}. Which one do you want the details for?`;
                    let options = routeList.routes.map((route, index) => {
                        return route.summary;
                    });
                    builder.Prompts.choice(session, prompt, options);
                }
            })
            .catch((error) => {
                session.send(`An error Occurred. Error message:\n\n${error}`);
            });
        }
    }, function(session, results) {
        if (results.response) {
            console.log(`User Choice: ${results.response.index}`)
            session.send(session.userData.routeList.routes[results.response.index - 1].details);
        } else {
            session.send("I didn't understand. Please ask me again.");
            console.log('Ending waterfall with no response.')  
        }
    }
]);

function sortLocations(args): LuisLocation[] {
    let locations = builder.EntityRecognizer.findAllEntities(args.entities, 'location::address').concat(builder.EntityRecognizer.findAllEntities(args.entities, 'location::station')); 
    let sortedLocations = locations.sort(function(a,b) {return (a.startIndex > b.startIndex) ? 1 : ((b.last_nom > a.last_nom) ? -1 : 0);} );
    return sortedLocations;
}
