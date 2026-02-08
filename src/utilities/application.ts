/* Imports ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

import mitt from 'mitt';
import { degreesLat, degreesLong, eciToGeodetic, gstime, propagate, twoline2satrec } from 'satellite.js';

/* Types //////////////////////////////////////////////////////////////////////////////////////////////////////////// */

export interface SpaceObject {
  name: string;
  noradId: number;
  info: Record<string, unknown>;
}

export interface SpaceObjectTle {
  noradId: number;
  line1: string;
  line2: string;
}

export interface Marker {
  name: string;
  noradId: number;
  latitude: number;
  longitude: number;
  altitude: number;
}

/* Constants //////////////////////////////////////////////////////////////////////////////////////////////////////// */

const earthRadiusKm = 6371;

/* Format /////////////////////////////////////////////////////////////////////////////////////////////////////////// */

export const getSpaceObjectDisplayText = (spaceObject: SpaceObject) => {
  return `${spaceObject.name} (${spaceObject.noradId})`;
};

/* Styles /////////////////////////////////////////////////////////////////////////////////////////////////////////// */

export const markerColor = 'palegreen';

export const createLabelElement = (text: string) => {
  const label = document.createElement('div');
  label.textContent = text;
  label.style.position = 'absolute';
  label.style.left = '50%';
  label.style.bottom = '0';
  label.style.transform = 'translate(-50%, -16px)';
  label.style.padding = 'var(--ja-spacing-2x-small) var(--ja-spacing-small)';
  label.style.borderRadius = 'var(--ja-border-radius-large)';
  label.style.background = 'color-mix(in srgb, var(--ja-color-neutral-1000) 75%, transparent)';
  label.style.color = 'var(--ja-color-neutral-0)';
  label.style.fontFamily = 'var(--ja-font-sans)';
  label.style.fontSize = 'var(--ja-font-size-small)';
  label.style.whiteSpace = 'nowrap';

  const wrapper = document.createElement('div');
  wrapper.style.position = 'relative';
  wrapper.style.pointerEvents = 'none';
  wrapper.appendChild(label);
  return wrapper;
};

/* Math ///////////////////////////////////////////////////////////////////////////////////////////////////////////// */

export const getSpaceObjectMarker = (
  spaceObject: SpaceObject,
  getTle: (noradId: number) => SpaceObjectTle | null,
  date: Date,
): Marker | null => {
  const spaceObjectTle = getTle(spaceObject.noradId);
  if (!spaceObjectTle) {
    console.error(`Failed to get TLE lines for ${getSpaceObjectDisplayText(spaceObject)}.`);
    return null;
  }

  const satrec = twoline2satrec(spaceObjectTle.line1, spaceObjectTle.line2);
  const positionAndVelocity = propagate(satrec, date);
  if (!positionAndVelocity?.position) {
    console.error(`Failed to propagate position for ${getSpaceObjectDisplayText(spaceObject)}.`);
    return null;
  }

  const geodetic = eciToGeodetic(positionAndVelocity.position, gstime(date));
  const altitude = Math.max(0, geodetic.height / earthRadiusKm);

  return {
    name: spaceObject.name,
    noradId: spaceObject.noradId,
    latitude: degreesLat(geodetic.latitude),
    longitude: degreesLong(geodetic.longitude),
    altitude,
  };
};

/* Eventing ///////////////////////////////////////////////////////////////////////////////////////////////////////// */

export enum EventType {
  FitToScreen = 'FitToScreen',
  ZoomIn = 'ZoomIn',
  ZoomOut = 'ZoomOut',
}

interface EventMap {
  [EventType.FitToScreen]: void;
  [EventType.ZoomIn]: void;
  [EventType.ZoomOut]: void;
}

export const eventHub = mitt<{ [T in keyof EventMap]: EventMap[T] }>();
