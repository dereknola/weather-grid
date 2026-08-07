import type { Location, NwsPointResponse, NwsStationsResponse, WeatherStation } from '../types/weather';
import { fetchWithTimeout } from './request';

const NWS_API_URL = 'https://api.weather.gov';

function distanceInMiles(fromLatitude: number, fromLongitude: number, toLatitude: number, toLongitude: number): number {
  const degreesToRadians = Math.PI / 180;
  const latitudeDelta = (toLatitude - fromLatitude) * degreesToRadians;
  const longitudeDelta = (toLongitude - fromLongitude) * degreesToRadians;
  const latitudeStart = fromLatitude * degreesToRadians;
  const latitudeEnd = toLatitude * degreesToRadians;
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(latitudeStart) * Math.cos(latitudeEnd) * Math.sin(longitudeDelta / 2) ** 2;

  return 3958.8 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetchWithTimeout(url, { headers: { Accept: 'application/geo+json' }, signal });
  if (!response.ok) throw new Error(`NOAA request failed with status ${response.status}`);
  return response.json() as Promise<T>;
}

export async function fetchNearestWeatherStation(location: Location, signal?: AbortSignal): Promise<WeatherStation | undefined> {
  if (location.countryCode !== 'US') return undefined;

  const point = await fetchJson<NwsPointResponse>(`${NWS_API_URL}/points/${location.latitude},${location.longitude}`, signal);
  if (!point.properties?.observationStations) return undefined;

  const stationCollection = await fetchJson<NwsStationsResponse>(point.properties.observationStations, signal);
  const stations = (stationCollection.features ?? []).flatMap((feature) => {
    const [longitude, latitude] = feature.geometry?.coordinates ?? [];
    const id = feature.properties?.stationIdentifier;
    const name = feature.properties?.name;
    if (!id || !name || typeof latitude !== 'number' || typeof longitude !== 'number' || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];

    return [{
      id,
      name,
      latitude,
      longitude,
      distanceMiles: distanceInMiles(location.latitude, location.longitude, latitude, longitude)
    }];
  });

  return stations.sort((first, second) => first.distanceMiles - second.distanceMiles)[0];
}
