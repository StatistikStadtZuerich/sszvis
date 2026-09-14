import { index, route, type RouteConfig } from "@react-router/dev/routes";
import { contentPages } from "./content-pages";

const routes = contentPages.map(({ routePath, contentPath }) =>
  routePath === "" ? index(contentPath) : route(routePath, contentPath),
) satisfies RouteConfig;

export default routes;
