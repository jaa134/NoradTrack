/* Imports ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

import { OSM } from 'ol/source.js';
import TileSource from 'ol/source/Tile.js';
import XYZ from 'ol/source/XYZ.js';

/* Skins //////////////////////////////////////////////////////////////////////////////////////////////////////////// */

export enum MapSkin {
  BlueMarble = 'BlueMarble',
  OpenStreetMap = 'OpenStreetMap',
  OpenTopoMap = 'OpenTopoMap',
  OpenHikingMap = 'OpenHikingMap',
}

export const mapSkinLabelMap: Record<MapSkin, string> = {
  [MapSkin.BlueMarble]: 'Blue Marble',
  [MapSkin.OpenStreetMap]: 'OpenStreetMap',
  [MapSkin.OpenTopoMap]: 'OpenTopoMap',
  [MapSkin.OpenHikingMap]: 'OpenHikingMap',
};

export const mapSkinSourceMap: Record<MapSkin, TileSource> = {
  [MapSkin.BlueMarble]: new XYZ({
    url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/2013-12-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg',
    wrapX: true,
  }),
  [MapSkin.OpenStreetMap]: new OSM(),
  [MapSkin.OpenTopoMap]: new XYZ({
    url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
    wrapX: true,
  }),
  [MapSkin.OpenHikingMap]: new XYZ({
    url: 'https://tile.openmaps.fr/openhikingmap/{z}/{x}/{y}.png',
    wrapX: true,
  }),
};

export const mapSkinOptions = Object.values(MapSkin).map((skin) => ({
  label: mapSkinLabelMap[skin],
  value: skin,
}));
