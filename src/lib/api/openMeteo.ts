import type {
  Forecast,
  ForecastResponse,
  GeocodingResponse,
  Location,
  SearchResult,
  TemperatureUnit
} from '../types/weather';
import { searchWaterFeatures } from './usgs';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

export async function searchLocations(query: string, signal?: AbortSignal): Promise<SearchResult[]> {
  const url = new URL(GEOCODING_URL);
  url.searchParams.set('name', query.trim());
  url.searchParams.set('count', '8');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');

  const response = await fetch(url, { signal });
  const body = (await response.json()) as GeocodingResponse;
  if (!response.ok || body.error) {
    throw new Error(body.reason ?? `Location search failed with status ${response.status}`);
  }

  const locationResults = (body.results ?? []).map((result) => ({
    id: result.id,
    name: result.name,
    country: result.country,
    countryCode: result.country_code,
    admin1: result.admin1,
    latitude: result.latitude,
    longitude: result.longitude,
    timezone: result.timezone,
    elevation: result.elevation
  }));
  const waterFeatures = await searchWaterFeatures(query, signal).catch(() => []);
  return [...waterFeatures, ...locationResults];
}

function assertForecastShape(response: ForecastResponse): void {
  if (!response.current || !response.daily?.time || !response.hourly?.time || response.daily.time.length < 5) {
    throw new Error('Open-Meteo returned an incomplete forecast.');
  }
}

export async function fetchForecast(
  location: Location,
  temperatureUnit: TemperatureUnit,
  signal?: AbortSignal
): Promise<Forecast> {
  const url = new URL(FORECAST_URL);
  url.searchParams.set('latitude', String(location.latitude));
  url.searchParams.set('longitude', String(location.longitude));
  url.searchParams.set('current', 'temperature_2m,apparent_temperature,weather_code,is_day');
  url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max');
  url.searchParams.set('hourly', 'temperature_2m,weather_code,precipitation_probability');
  url.searchParams.set('forecast_days', '5');
  url.searchParams.set('temperature_unit', temperatureUnit);
  url.searchParams.set('timezone', 'auto');

  const response = await fetch(url, { signal });
  const body = (await response.json()) as ForecastResponse;
  if (!response.ok || body.error) {
    throw new Error(body.reason ?? `Forecast request failed with status ${response.status}`);
  }
  assertForecastShape(body);

  const hourlyStart = body.hourly.time.findIndex((time) => time >= body.current.time);
  const start = hourlyStart >= 0 ? hourlyStart : 0;

  return {
    location,
    latitude: body.latitude,
    longitude: body.longitude,
    timezone: body.timezone,
    temperatureUnit: body.current_units.temperature_2m,
    current: {
      time: body.current.time,
      temperature: body.current.temperature_2m,
      apparentTemperature: body.current.apparent_temperature,
      weatherCode: body.current.weather_code,
      isDay: body.current.is_day === 1
    },
    daily: body.daily.time.slice(0, 5).map((date, index) => ({
      date,
      weatherCode: body.daily.weather_code[index],
      high: body.daily.temperature_2m_max[index],
      low: body.daily.temperature_2m_min[index],
      precipitationProbability: body.daily.precipitation_probability_max[index]
    })),
    hourly: body.hourly.time.slice(start, start + 10).map((time, index) => ({
      time,
      temperature: body.hourly.temperature_2m[start + index],
      weatherCode: body.hourly.weather_code[start + index],
      precipitationProbability: body.hourly.precipitation_probability[start + index]
    }))
  };
}