/* Skins //////////////////////////////////////////////////////////////////////////////////////////////////////////// */

export const globeBumpImageUrl = '/images/globe/topology.png';

export enum GlobeSkin {
  BlueMarble = 'BlueMarble',
  HighRes = 'HighRes',
  Grid = 'Grid',
}

export const globeSkinLabelMap: Record<GlobeSkin, string> = {
  [GlobeSkin.BlueMarble]: 'Blue Marble',
  [GlobeSkin.HighRes]: 'High-Res',
  [GlobeSkin.Grid]: 'Grid',
};

export const globeSkinSourceMap: Record<GlobeSkin, string> = {
  [GlobeSkin.BlueMarble]: '/images/globe/blue-marble.jpg',
  [GlobeSkin.HighRes]: '/images/globe/high-res.jpg',
  [GlobeSkin.Grid]: '/images/globe/grid.jpg',
};

export const globeSkinOptions = Object.values(GlobeSkin).map((skin) => ({
  label: globeSkinLabelMap[skin],
  value: skin,
}));
