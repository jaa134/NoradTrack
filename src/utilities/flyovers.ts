/* Imports ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

import {
  type Degrees,
  degreesToRadians,
  ecfToLookAngles,
  eciToEcf,
  type GeodeticLocation,
  gstime,
  json2satrec,
  type Kilometer,
  propagate,
  radiansToDegrees,
} from 'satellite.js';

import { type SpaceObject, type UserPosition } from '@/utilities/application.js';

/* Types //////////////////////////////////////////////////////////////////////////////////////////////////////////// */

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

/* Constants //////////////////////////////////////////////////////////////////////////////////////////////////////// */

export const flyoverProjectionDurationDays = 30;
const flyoverProjectionDuration = flyoverProjectionDurationDays * 24 * 60 * 60 * 1000; // 1 month
const flyoverProjectionInterval = 60 * 1000; // 1 minutes
const flyoverMinElevation = 30; // 30 degrees

/* Calculations ///////////////////////////////////////////////////////////////////////////////////////////////////// */

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
