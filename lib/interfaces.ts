export interface IRouteProvider {
    getRoutes(origin: LuisLocation, destination: LuisLocation): Promise<RouteList>;
    // getRoutes(origin: string, destination: string): RouteList;
}

export interface RouteList {
    origin: string;
    destination: string;
    routes: Route[];
}

export interface Route {
    summary: string;
    details: string;
}

export interface LuisLocation {
    type: string;
    entity: string;
}