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

/* Methods ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

export const getSpaceObjectDisplayText = (spaceObject: SpaceObject) => {
  return `${spaceObject.name} (${spaceObject.noradId})`;
};
