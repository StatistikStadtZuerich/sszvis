export const STADT_KREISE_KEY: "zurichStadtKreise";
export const STATISTISCHE_QUARTIERE_KEY: "zurichStatistischeQuartiere";
export const STATISTISCHE_ZONEN_KEY: "zurichStatistischeZonen";
export const WAHL_KREISE_KEY: "zurichWahlKreise";
export const AGGLOMERATION_2012_KEY: "zurichAgglomeration2012";
export const SWITZERLAND_KEY: "switzerland";
/**
 * swissMapProjection
 *
 * A function for creating d3 projection functions, customized for the dimensions of the map you need.
 * Because this projection generator involves calculating the boundary of the features that will be
 * projected, the result of these calculations is cached internally. Hence the featureBoundsCacheKey.
 * You don't need to worry about this - mostly it's the map module components which use this function.
 *
 * @param  {Number} width                           The width of the projection destination space.
 * @param  {Number} height                          The height of the projection destination space.
 * @param  {Object} featureCollection               The feature collection that will be projected by the returned function. Needed to calculated a good size.
 * @param  {String} featureBoundsCacheKey           Used internally, this is a key for the cache for the expensive part of this computation.
 * @return {Function}                               The projection function.
 */
export const swissMapProjection: ((...args: any[]) => any) & {
    cache: Map<string | number, any>;
};
export function swissMapPath(width: number, height: number, featureCollection: GeoJson, featureBoundsCacheKey?: string): typeof geoPath;
export function pixelsFromGeoDistance(projection: Function, centerPoint: array, meterDistance: number): number;
export const GEO_KEY_DEFAULT: "geoId";
export function prepareMergedGeoData(dataset: any[], geoJson: Object, keyName: string): any[];
export function getGeoJsonCenter(geoJson: Object): any;
export function widthAdaptiveMapPathStroke(width: number): number;
import { geoPath } from "d3";
//# sourceMappingURL=mapUtils.d.ts.map