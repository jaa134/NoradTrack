/* Imports ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

import { type FeatureCollection } from 'geojson';
import { readonly, ref } from 'vue';

/* Cache //////////////////////////////////////////////////////////////////////////////////////////////////////////// */

let cachedGeoJson: FeatureCollection | null = null;
let inflightRequest: Promise<FeatureCollection> | null = null;

/* Fetch //////////////////////////////////////////////////////////////////////////////////////////////////////////// */

const fetchCountriesGeoJson = async () => {
  if (cachedGeoJson) {
    return cachedGeoJson;
  }

  if (inflightRequest) {
    return inflightRequest;
  }

  const makeRequest = async () => {
    try {
      const response = await fetch('/data/countries.geo.json');
      if (!response.ok) {
        throw new Error(`Failed to fetch countries geojson: ${response.statusText}`);
      }

      const data = (await response.json()) as FeatureCollection;
      cachedGeoJson = data;
      return data;
    } catch (error) {
      console.error(error);
      throw new Error(`Failed to fetch countries geojson: ${JSON.stringify(error, null, 2)}`, {
        cause: error,
      });
    } finally {
      inflightRequest = null;
    }
  };

  const request = makeRequest();
  inflightRequest = request;
  return request;
};

/* Composable ////////////////////////////////////////////////////////////////////////////////////////////////////// */

export const useCountriesGeoJson = () => {
  const data = ref<FeatureCollection | null>(cachedGeoJson);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);

  const load = async () => {
    if (data.value) {
      return data.value;
    }

    isLoading.value = true;
    error.value = null;

    try {
      data.value = await fetchCountriesGeoJson();
    } catch (fetchError) {
      error.value = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
    } finally {
      isLoading.value = false;
    }
  };

  void load();

  return {
    data: readonly(data),
    isLoading: readonly(isLoading),
    error: readonly(error),
  };
};
