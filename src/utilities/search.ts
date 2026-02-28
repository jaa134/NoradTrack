/* Imports ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

import { z } from 'zod';

/* Schema /////////////////////////////////////////////////////////////////////////////////////////////////////////// */

const OrbitMeanElementsMessageV3Schema = z.object({
  OBJECT_NAME: z.string(),
  OBJECT_ID: z.string(),
  EPOCH: z.string(),
  MEAN_MOTION: z.number(),
  ECCENTRICITY: z.number(),
  INCLINATION: z.number(),
  RA_OF_ASC_NODE: z.number(),
  ARG_OF_PERICENTER: z.number(),
  MEAN_ANOMALY: z.number(),
  EPHEMERIS_TYPE: z.literal(0),
  CLASSIFICATION_TYPE: z.enum(['U', 'C']),
  NORAD_CAT_ID: z.number(),
  ELEMENT_SET_NO: z.number(),
  REV_AT_EPOCH: z.number(),
  BSTAR: z.number(),
  MEAN_MOTION_DOT: z.number(),
  MEAN_MOTION_DDOT: z.number(),
});

export type OrbitMeanElementsMessageV3 = z.infer<typeof OrbitMeanElementsMessageV3Schema>;

export const CelestrakResponseSchema = z.array(OrbitMeanElementsMessageV3Schema);
