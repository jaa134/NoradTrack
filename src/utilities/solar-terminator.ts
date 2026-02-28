// Copyright © Loft Orbital Solutions Inc.

/* Types //////////////////////////////////////////////////////////////////////////////////////////////////////////// */

interface SunEclipticPosition {
  lambda: number;
  R: number;
}

interface SunEquatorialPosition {
  alpha: number;
  delta: number;
}

/* Constants //////////////////////////////////////////////////////////////////////////////////////////////////////// */

const R2D: number = 180.0 / Math.PI;
const D2R: number = Math.PI / 180.0;

/* Utilities //////////////////////////////////////////////////////////////////////////////////////////////////////// */

/* Calculate the present UTC Julian Date.
 * Function is valid after the beginning of the UNIX epoch 1970-01-01 and ignores leap seconds. */
function toJulian(datetime: Date): number {
  return datetime.getTime() / 86400000 + 2440587.5;
}

/* Calculate Greenwich Mean Sidereal Time according to http://aa.usno.navy.mil/faq/docs/GAST.php */
function toGMST(julianDay: number): number {
  // Low precision equation is good enough for our purposes.
  return (18.697374558 + 24.06570982441908 * (julianDay - 2451545.0)) % 24;
}

/* For a given hour angle and sun position, compute the latitude of the terminator in degrees. */
function computeLatitude(hourAngle: number, sunEquatorialPosition: SunEquatorialPosition): number {
  return Math.atan(-Math.cos(hourAngle * D2R) / Math.tan(sunEquatorialPosition.delta * D2R)) * R2D;
}

/* Compute the hour angle of the sun for a longitude on Earth.
 * Return the hour angle in degrees. */
function computeHourAngle(
  longitude: number,
  sunEquatorialPosition: SunEquatorialPosition,
  greenwhichSiderealTime: number,
): number {
  return (greenwhichSiderealTime + longitude / 15.0) * 15.0 - sunEquatorialPosition.alpha;
}

/* Compute the Sun's equatorial position from its ecliptic position.
 * Inputs are expected in degrees. Outputs are in degrees as well. */
function computeSunEquatorialPosition(
  sunEclipticPosition: SunEclipticPosition,
  sunEclipticObliquity: number,
): SunEquatorialPosition {
  const sunEclipticLongitude: number = sunEclipticPosition.lambda;

  const alpha: number = Math.atan(Math.cos(sunEclipticObliquity * D2R) * Math.tan(sunEclipticLongitude * D2R)) * R2D;
  const delta: number = Math.asin(Math.sin(sunEclipticObliquity * D2R) * Math.sin(sunEclipticLongitude * D2R)) * R2D;

  const lQuadrant: number = Math.floor(sunEclipticLongitude / 90.0) * 90.0;
  const raQuadrant: number = Math.floor(alpha / 90.0) * 90.0;

  return {
    alpha: alpha + (lQuadrant - raQuadrant),
    delta: delta,
  };
}

function computeSunEclipticObliquity(julianDay: number): number {
  // Following the short term expression in
  // http://en.wikipedia.org/wiki/Axial_tilt#Obliquity_of_the_ecliptic_.28Earth.27s_axial_tilt.29
  const n = julianDay - 2451545.0;

  // Julian centuries since J2000.0
  const T = n / 36525;
  const epsilon =
    23.43929111 -
    T *
      (46.836769 / 3600 -
        T * (0.0001831 / 3600 + T * (0.0020034 / 3600 - T * (0.576e-6 / 3600 - (T * 4.34e-8) / 3600))));

  return epsilon;
}

/* Compute the position of the Sun in ecliptic coordinates at Julian Day.
 * Following http://en.wikipedia.org/wiki/Position_of_the_Sun */
function computeSunEclipticPosition(julianDay: number): SunEclipticPosition {
  // Days since start of J2000.0
  const n: number = julianDay - 2451545.0;

  // Mean longitude of the Sun
  const L: number = (280.46 + 0.9856474 * n) % 360.0;

  // Mean anomaly of the Sun
  const g: number = (357.528 + 0.9856003 * n) % 360.0;

  // Ecliptic longitude of Sun
  const lambda: number = L + 1.915 * Math.sin(g * D2R) + 0.02 * Math.sin(2 * g * D2R);

  // Distance from Sun in AU
  const R: number = 1.00014 - 0.01671 * Math.cos(g * D2R) - 0.0014 * Math.cos(2 * g * D2R);

  return {
    lambda,
    R,
  };
}

/* Compute the sub-solar point (the point on Earth directly beneath the sun).
 * Returns latitude and longitude in degrees. */
export function computeSubSolarPoint(datetime: Date): { latitude: number; longitude: number } {
  const julian: number = toJulian(datetime);
  const gmst: number = toGMST(julian);

  const sunEquatorialPosition: SunEquatorialPosition = computeSunEquatorialPosition(
    computeSunEclipticPosition(julian),
    computeSunEclipticObliquity(julian),
  );

  const latitude = sunEquatorialPosition.delta;
  let longitude = sunEquatorialPosition.alpha - gmst * 15;
  longitude = (((longitude % 360) + 540) % 360) - 180;

  return {
    latitude,
    longitude,
  };
}

/* Compute Solar Terminator at given instant.
 * Returns array of latitude / longitude coordinates.
 *
 * - https://en.wikipedia.org/wiki/Sunrise_equation
 * - https://github.com/webgeodatavore/GeoJSON.Terminator (main source)
 * - https://www.aa.quae.nl/en/antwoorden/zonpositie.html#v526
 * - https://jsfiddle.net/5mvk1oc9/
 * - https://pskreporter.info/pskmap
 * - https://github.com/Viglino/ol-ext/blob/master/src/source/DayNight.js */
export function computeSolarTerminator(datetime: Date, resolution = 2): [number, number][] {
  const julian: number = toJulian(datetime);
  const gmst: number = toGMST(julian);

  // Array of latitude/longitude coordinates.
  const solarTerminator: [number, number][] = [];

  const sunEquatorialPosition: SunEquatorialPosition = computeSunEquatorialPosition(
    computeSunEclipticPosition(julian),
    computeSunEclipticObliquity(julian),
  );

  const startMinus = -360;

  for (let i = 0; i <= 720 * resolution; i++) {
    const longitude: number = startMinus + i / resolution;

    solarTerminator[i + 1] = [
      longitude,
      computeLatitude(computeHourAngle(longitude, sunEquatorialPosition, gmst), sunEquatorialPosition),
    ];
  }

  if (sunEquatorialPosition.delta < 0.0) {
    solarTerminator[0] = [startMinus, 90];
    solarTerminator[solarTerminator.length] = [360, 90];
  } else {
    solarTerminator[0] = [startMinus, -90];
    solarTerminator[solarTerminator.length] = [360, -90];
  }

  return solarTerminator;
}
