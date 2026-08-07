export type TemperatureUnit = 'celsius' | 'fahrenheit';

export type DisplaySettings = {
  current: boolean;
  daily: boolean;
  hourly: boolean;
  stations: boolean;
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
  featureType?: string;
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

export type WeatherStation = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceMiles: number;
};

export type NwsPointResponse = {
  properties?: {
    observationStations?: string;
  };
};

export type NwsStationsResponse = {
  features?: Array<{
    geometry?: {
      coordinates?: [number, number];
    };
    properties?: {
      stationIdentifier?: string;
      name?: string;
    };
  }>;
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

export type UsgsWaterFeaturesResponse = {
  features?: Array<{
    attributes?: {
      gaz_id?: number;
      gaz_name?: string;
      gaz_featureclass?: string;
      state_alpha?: string;
      county_name?: string;
    };
    geometry?: {
      x?: number;
      y?: number;
    };
  }>;
};

export type WikidataSearchResponse = {
  search?: Array<{
    id: string;
    label: string;
    description?: string;
  }>;
};

export type WikidataEntityResponse = {
  entities?: Record<string, {
    claims?: {
      P625?: Array<{
        mainsnak?: {
          datavalue?: {
            value?: {
              latitude?: number;
              longitude?: number;
            };
          };
        };
      }>;
    };
  }>;
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