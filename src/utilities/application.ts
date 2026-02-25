/* Imports ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

import mitt from 'mitt';
import {
  type Degrees,
  degreesLat,
  degreesLong,
  degreesToRadians,
  ecfToLookAngles,
  eciToEcf,
  eciToGeodetic,
  type GeodeticLocation,
  gstime,
  json2satrec,
  type Kilometer,
  KilometerPerSecond,
  type OMMJsonObject,
  propagate,
  radiansToDegrees,
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

/* Flyovers ///////////////////////////////////////////////////////////////////////////////////////////////////////// */

type SpaceObjectPropagationTimeSeries = {
  date: Date;
  elevation: Degrees;
  azimuth: Degrees;
  distance: Kilometer;
}[];

export interface Flyover {
  startDate: Date;
  endDate: Date;
  minElevation: Degrees;
  maxElevation: Degrees;
  startAzimuth: Degrees;
  endAzimuth: Degrees;
  minDistance: Kilometer;
  maxDistance: Kilometer;
}

export const flyoverProjectionDurationDays = 30;
const flyoverProjectionDuration = flyoverProjectionDurationDays * 24 * 60 * 60 * 1000; // 1 month
const flyoverProjectionInterval = 60 * 1000; // 1 minutes
const flyoverMinElevation = 30; // 30 degrees

export const getFlyovers = (spaceObject: SpaceObject, userPosition: UserPosition): Flyover[] => {
  const satrec = json2satrec(spaceObject.omm);

  const observerPosition: GeodeticLocation = {
    longitude: degreesToRadians(userPosition.longitude),
    latitude: degreesToRadians(userPosition.latitude),
    height: 0,
  };

  const startTime = new Date().getTime();
  const positionTimeSeries: SpaceObjectPropagationTimeSeries = [];
  for (let offset = 0; offset < flyoverProjectionDuration; offset += flyoverProjectionInterval) {
    const date = new Date(startTime + offset);
    const data = propagate(satrec, date);
    if (data?.position) {
      const position = eciToEcf(data.position, gstime(date));
      const lookAngle = ecfToLookAngles(observerPosition, position);
      const elevation = radiansToDegrees(lookAngle.elevation);
      const azimuth = radiansToDegrees(lookAngle.azimuth);
      const distance = lookAngle.rangeSat;
      if (elevation >= flyoverMinElevation) {
        positionTimeSeries.push({ date, elevation, azimuth, distance });
      }
    }
  }

  const flyovers: Flyover[] = [];

  let index = 0;
  while (index < positionTimeSeries.length) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const start = positionTimeSeries[index]!;

    // Start tracking the flyover
    const flyover: Flyover = {
      startDate: start.date,
      endDate: start.date,
      minElevation: start.elevation,
      maxElevation: start.elevation,
      startAzimuth: start.azimuth,
      endAzimuth: start.azimuth,
      minDistance: start.distance,
      maxDistance: start.distance,
    };

    index++;

    // Continue updating the current flyover metrics until we reach a data
    // point that does not belong to the same flyover. A flyover stops when
    // the next data point occurs more than the projection interval in the future.
    while (index < positionTimeSeries.length) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const current = positionTimeSeries[index]!;

      const previous = positionTimeSeries[index - 1];
      if (previous && current.date.getTime() - previous.date.getTime() > flyoverProjectionInterval) {
        break;
      }

      flyover.endDate = current.date;
      flyover.minElevation = Math.min(flyover.minElevation, current.elevation);
      flyover.maxElevation = Math.max(flyover.maxElevation, current.elevation);
      flyover.startAzimuth = Math.min(flyover.startAzimuth, current.azimuth);
      flyover.endAzimuth = Math.max(flyover.endAzimuth, current.azimuth);
      flyover.minDistance = Math.min(flyover.minDistance, current.distance);
      flyover.maxDistance = Math.max(flyover.maxDistance, current.distance);

      index++;
    }

    flyovers.push(flyover);
  }

  return flyovers;
};
