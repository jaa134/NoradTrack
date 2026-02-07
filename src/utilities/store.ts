/* Imports ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

import { defineStore, DefineStoreOptionsBase, StateTree, Store } from 'pinia';

/* Versioning /////////////////////////////////////////////////////////////////////////////////////////////////////// */

const isValidVersion = (version: number) => {
  return Number.isInteger(version) && version >= 0;
};

const parseStoreVersion = (version: string | null | undefined) => {
  if (typeof version !== 'string') {
    return null;
  }

  const convertedValue = Number(version);

  if (!isValidVersion(convertedValue)) {
    return null;
  }

  return convertedValue;
};

/* Storage Key ////////////////////////////////////////////////////////////////////////////////////////////////////// */

const storageKeyInvariant = 'noradTrackStorage';
const storageKeySeparator = '-';

export const getStorageKey = (storeKey: string) => {
  return [storageKeyInvariant, storeKey].join(storageKeySeparator);
};

const isStorageKey = (key: string) => {
  return key.startsWith(storageKeyInvariant);
};

const parseStorageKey = (key: string) => {
  const parts = key.split(storageKeySeparator);

  const name = parts.at(1);
  const version = parseStoreVersion(parts.at(2));

  return { name, version };
};

/* Setup //////////////////////////////////////////////////////////////////////////////////////////////////////////// */

export const createStore = <Id extends string, TState extends StateTree>(
  name: string,
  version: number,
  createState: () => TState,
  options?: DefineStoreOptionsBase<TState, Store<Id>>,
) => {
  if (!isValidVersion(version)) {
    throw new Error('Store version must be a positive integer.');
  }

  const outdatedStorageKeys = Object.keys(localStorage).filter((key) => {
    if (!isStorageKey(key)) {
      return false;
    }

    const parsedKey = parseStorageKey(key);
    return parsedKey.name === name && parsedKey.version !== version;
  });

  outdatedStorageKeys.forEach((key) => {
    localStorage.removeItem(key);
  });

  const keySuffix = [name, version].join(storageKeySeparator);
  return defineStore(keySuffix, createState, options);
};
