export type TemperatureUnit = 'celsius' | 'fahrenheit';

export type DisplaySettings = {
  current: boolean;
  daily: boolean;
  hourly: boolean;
  temperatureUnit: TemperatureUnit;
};

export type Location = {
  id: number;
  name: string;
  country: string;
  countryCode: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone: string;
};

export type SearchResult = Location & {
  elevation?: number;
};

export type CurrentWeather = {
  time: string;
  temperature: number;
  apparentTemperature: number;
  weatherCode: number;
  isDay: boolean;
};

export type DailyWeather = {
  date: string;
  weatherCode: number;
  high: number;
  low: number;
  precipitationProbability: number;
};

export type HourlyWeather = {
  time: string;
  temperature: number;
  weatherCode: number;
  precipitationProbability: number;
};

export type Forecast = {
  location: Location;
  timezone: string;
  temperatureUnit: string;
  current: CurrentWeather;
  daily: DailyWeather[];
  hourly: HourlyWeather[];
};

export type GeocodingResponse = {
  results?: Array<{
    id: number;
    name: string;
    country: string;
    country_code: string;
    admin1?: string;
    latitude: number;
    longitude: number;
    timezone: string;
    elevation?: number;
  }>;
  error?: boolean;
  reason?: string;
};

export type ForecastResponse = {
  timezone: string;
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    weather_code: number;
    is_day: number;
  };
  current_units: {
    temperature_2m: string;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    precipitation_probability: number[];
  };
  error?: boolean;
  reason?: string;
};