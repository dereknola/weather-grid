import { fetchNearestWeatherStation } from '../api/noaa';
import { fetchForecast } from '../api/openMeteo';
import type { DisplaySettings, Forecast, Location, TemperatureUnit, WeatherStation } from '../types/weather';

const STORAGE_KEY = 'weather-grid:v1';

export type CardState = { forecast?: Forecast; loading: boolean; error?: string; station?: WeatherStation; stationLoading?: boolean };
export type WeatherGridState = {
  readonly locations: Location[];
  readonly settings: DisplaySettings;
  readonly cards: Record<number, CardState>;
  readonly announce: string;
  addLocation: (location: Location) => void;
  removeLocation: (id: number) => void;
  retry: (id: number) => void;
  refreshAll: () => void;
  setUnit: (unit: TemperatureUnit) => void;
  toggleSection: (section: 'current' | 'daily' | 'hourly' | 'stations') => void;
};

const defaultSettings: DisplaySettings = { current: true, daily: true, hourly: true, stations: true, temperatureUnit: 'fahrenheit' };

function loadSavedState(): { locations: Location[]; settings: DisplaySettings } {
  if (typeof localStorage === 'undefined') return { locations: [], settings: defaultSettings };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<{ locations: Location[]; settings: DisplaySettings }>;
    const locations = Array.isArray(saved.locations) ? saved.locations.filter((location) => typeof location?.id === 'number' && typeof location?.name === 'string') : [];
    const settings = { ...defaultSettings, ...(saved.settings ?? {}) };
    return { locations, settings: { current: Boolean(settings.current), daily: Boolean(settings.daily), hourly: Boolean(settings.hourly), stations: Boolean(settings.stations), temperatureUnit: settings.temperatureUnit === 'fahrenheit' ? 'fahrenheit' : 'celsius' } };
  } catch { return { locations: [], settings: defaultSettings }; }
}

function persist(locations: Location[], settings: DisplaySettings): void {
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify({ locations, settings }));
}

export function createWeatherGrid(): WeatherGridState {
  const savedState = loadSavedState();
  let locations = $state<Location[]>(savedState.locations);
  let settings = $state<DisplaySettings>(savedState.settings);
  let cards = $state<Record<number, CardState>>({});
  let announce = $state('');
  const requestIds = new Map<number, number>();

  function loadForecast(location: Location): void {
    const requestId = (requestIds.get(location.id) ?? 0) + 1;
    requestIds.set(location.id, requestId);
    cards[location.id] = { ...cards[location.id], loading: true, error: undefined, station: undefined, stationLoading: location.countryCode === 'US' };
    fetchForecast(location, settings.temperatureUnit).then((forecast) => {
      if (requestIds.get(location.id) === requestId) cards[location.id] = { ...cards[location.id], forecast, loading: false };
    }).catch((error: unknown) => {
      if (requestIds.get(location.id) === requestId) cards[location.id] = { ...cards[location.id], loading: false, error: error instanceof Error ? error.message : 'Unable to load this forecast.' };
    });
    fetchNearestWeatherStation(location).then((station) => {
      if (requestIds.get(location.id) === requestId) cards[location.id] = { ...cards[location.id], station, stationLoading: false };
    }).catch(() => {
      if (requestIds.get(location.id) === requestId) cards[location.id] = { ...cards[location.id], stationLoading: false };
    });
  }

  function addLocation(location: Location): void {
    if (locations.some((saved) => saved.id === location.id)) { announce = `${location.name} is already on your grid.`; return; }
    locations = [...locations, location]; persist(locations, settings); announce = `${location.name} added to your grid.`; loadForecast(location);
  }
  function removeLocation(id: number): void {
    const location = locations.find((saved) => saved.id === id);
    locations = locations.filter((saved) => saved.id !== id); delete cards[id]; requestIds.delete(id); persist(locations, settings);
    announce = location ? `${location.name} removed from your grid.` : '';
  }
  function refreshAll(): void { locations.forEach(loadForecast); announce = 'Refreshing forecasts.'; }
  function setUnit(unit: TemperatureUnit): void { if (settings.temperatureUnit === unit) return; settings = { ...settings, temperatureUnit: unit }; persist(locations, settings); refreshAll(); }
  function toggleSection(section: 'current' | 'daily' | 'hourly' | 'stations'): void {
    const enabledCount = Number(settings.current) + Number(settings.daily) + Number(settings.hourly);
    if (section !== 'stations' && settings[section] && enabledCount === 1) return;
    settings = { ...settings, [section]: !settings[section] }; persist(locations, settings);
  }

  const state: WeatherGridState = {
    get locations() { return locations; },
    get settings() { return settings; },
    get cards() { return cards; },
    get announce() { return announce; },
    addLocation, removeLocation, refreshAll, setUnit, toggleSection,
    retry: (id) => { const location = locations.find((saved) => saved.id === id); if (location) loadForecast(location); }
  };
  savedState.locations.forEach(loadForecast);
  return state;
}
