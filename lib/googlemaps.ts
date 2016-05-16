const GoogleMapsAPI = require('googlemaps');
import { IRouteProvider, LuisLocation, RouteList, Route } from './interfaces';

export class GoogleMapsRoutesProvider implements IRouteProvider {
    config = {
        stagger_time:       1000, // for elevationPath 
        encode_polylines:   false,
        secure:             true // use https 
    };
    private gmAPI;
    
    constructor(public options) {
        Object.assign(this.config, options);
        this.gmAPI = new GoogleMapsAPI(this.config);
    }
    
    getRoutes = (originLuisLocation: LuisLocation, destinationLuisLocation: LuisLocation): Promise<RouteList>  => {
        return this.getDirectionsAsync(originLuisLocation.entity, destinationLuisLocation.entity).then((data) => {
            return this.processRoutes(data);
        });
    }

    buildTripInfo = (route: google.maps.DirectionsRoute): TripInfo => {
        return <TripInfo>{
            startTime: route.legs[0].departure_time.text,
            endTime: route.legs[route.legs.length - 1].arrival_time.text,
            totalTime: route.legs.reduce((prev, curr) => {
                return prev + curr.duration.value;
            }, 0)
        }
    }

    private processRoutes(routes: google.maps.DirectionsRoute[]): RouteList {
        return <RouteList> {
            origin: routes[0].legs[0].start_address,
            destination: routes[0].legs[routes[0].legs.length - 1].end_address,
            routes: routes.map((route) => {
                return {
                    summary: this.buildRouteSummary(route),
                    details: this.buildRouteDetails(route)
                }
            })
        };
    }
    
    private buildRouteSummary(route: google.maps.DirectionsRoute): string {
        let tripInfo = this.buildTripInfo(route);
        let steps: string[] = [];
        route.legs.forEach((leg) => {
            leg.steps.forEach((step) => {
                if (step.travel_mode.toString() != 'WALKING') {
                    steps.push(step.transit_details.line.short_name);
                }
            });
        });
        return `${tripInfo.endTime} to ${tripInfo.startTime}, ${steps.join(', ')}`;
    }
    
    private buildRouteDetails(route: google.maps.DirectionsRoute): string {
        let tripInfo = this.buildTripInfo(route);
        let message = [`If you leave at ${tripInfo.startTime} you will arrive at ${tripInfo.endTime}`];
        route.legs.forEach((leg) => {
            leg.steps.forEach((step) => {
                if (step.travel_mode.toString() == 'WALKING') {
                    message.push(step.html_instructions);
                } else { //maybe an else if? or switch so if travel_mode = TRANSIT?
                    let stepStartName = step.transit_details.departure_stop.name;
                    let stepStopName = step.transit_details.arrival_stop.name;
                    let stepPrefix = `Ride ${step.transit_details.line.short_name} for`;
                    message.push(`${stepPrefix} ${step.duration.text} from ${stepStartName} to ${stepStopName}`);
                }
            });
        });
        return message.join('\n\n');
    }
    
    private getDirectionsAsync = (origin, destination): Promise<google.maps.DirectionsRoute[]> => {
        return new Promise<any>((resolve, reject) => {
            this.gmAPI.directions({
                origin: origin,
                destination: destination,
                mode: 'transit',
                departure_time: new Date()
            }, function(error, data: google.maps.DirectionsResult) {
                if (error) {
                    reject(error);
                } else {
                    resolve(data.routes);
                }
            });
        });
    }
}

interface TripInfo {
    startTime: string,
    endTime: string,
    totalTime: number
}