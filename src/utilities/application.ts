/* Imports ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

import mitt from 'mitt';
import {
  type Degrees,
  degreesLat,
  degreesLong,
  eciToGeodetic,
  gstime,
  json2satrec,
  type Kilometer,
  KilometerPerSecond,
  type OMMJsonObject,
  propagate,
} from 'satellite.js';

/* Types //////////////////////////////////////////////////////////////////////////////////////////////////////////// */

export interface SpaceObject {
  name: string;
  noradId: number;
  objectId: string;
  classification: string;
  meanMotion: number;
  omm: OMMJsonObject;
}

/* Constants //////////////////////////////////////////////////////////////////////////////////////////////////////// */

export const earthRadius: Kilometer = 6371;

/* Format /////////////////////////////////////////////////////////////////////////////////////////////////////////// */

export const getSpaceObjectDisplayText = (spaceObject: SpaceObject) => {
  return `${spaceObject.name} (${spaceObject.noradId})`;
};

/* Styles /////////////////////////////////////////////////////////////////////////////////////////////////////////// */

export const userPositionMarkerColor = 'rgb(255, 0, 0)';

export const spaceObjectMarkerColor = 'rgb(152, 251, 152)';
export const spaceObjectMarkerFocusColor = 'rgb(255, 45, 149)';

export const countryGeoJsonColor = 'rgb(255, 255, 0)';

export const createLabelElement = (text: string) => {
  const label = document.createElement('div');
  label.textContent = text;
  label.style.position = 'absolute';
  label.style.left = '50%';
  label.style.bottom = '0';
  label.style.transform = 'translate(-50%, -16px)';
  label.style.padding = 'var(--ja-spacing-3x-small) var(--ja-spacing-x-small)';
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

/* Propagate OMM //////////////////////////////////////////////////////////////////////////////////////////////////// */

export interface PropagatedOmm {
  longitude: Degrees;
  latitude: Degrees;
  altitude: Kilometer;
  velocity: KilometerPerSecond;
}

export const propagateOmm = (omm: OMMJsonObject, date: Date): PropagatedOmm | null => {
  const satrec = json2satrec(omm);

  const propagatedOmm = propagate(satrec, date);
  if (!propagatedOmm) {
    return null;
  }

  const geodetic = eciToGeodetic(propagatedOmm.position, gstime(date));

  return {
    longitude: degreesLong(geodetic.longitude),
    latitude: degreesLat(geodetic.latitude),
    altitude: geodetic.height,
    velocity: Math.sqrt(propagatedOmm.velocity.x ** 2 + propagatedOmm.velocity.y ** 2 + propagatedOmm.velocity.z ** 2),
  };
};

/* Marker /////////////////////////////////////////////////////////////////////////////////////////////////////////// */

export interface MarkerBase {
  label: string;
  latitude: number;
  longitude: number;
  altitude: number;
}

export interface SpaceObjectMarker extends MarkerBase {
  noradId: number;
}

export interface UserPositionMarker extends MarkerBase {
  accuracy: number;
}

export type Marker = SpaceObjectMarker | UserPositionMarker;

export const getUserPositionMarker = (userPosition: UserPosition): UserPositionMarker => {
  return {
    label: 'You are here',
    latitude: userPosition.latitude,
    longitude: userPosition.longitude,
    altitude: 0,
    accuracy: userPosition.accuracy,
  };
};

export const getSpaceObjectMarker = (spaceObject: SpaceObject, date: Date): SpaceObjectMarker | null => {
  const propagatedOmm = propagateOmm(spaceObject.omm, date);
  if (!propagatedOmm) {
    return null;
  }

  return {
    label: spaceObject.name,
    latitude: propagatedOmm.latitude,
    longitude: propagatedOmm.longitude,
    altitude: propagatedOmm.altitude,
    noradId: spaceObject.noradId,
  };
};

/* Eventing ///////////////////////////////////////////////////////////////////////////////////////////////////////// */

export enum EventType {
  FitToScreen = 'FitToScreen',
  ZoomIn = 'ZoomIn',
  ZoomOut = 'ZoomOut',
}

interface EventMap {
  [EventType.FitToScreen]: undefined;
  [EventType.ZoomIn]: undefined;
  [EventType.ZoomOut]: undefined;
}

export const eventHub = mitt<{ [T in keyof EventMap]: EventMap[T] }>();

/* Position ///////////////////////////////////////////////////////////////////////////////////////////////////////// */

export interface UserPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export const getUserPosition = (options?: PositionOptions): Promise<UserPosition> => {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported in this environment.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        reject(new Error(error.message || 'Failed to get user position.'));
      },
      options,
    );
  });
};
