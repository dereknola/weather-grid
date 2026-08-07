<script lang="ts">
  import { onMount } from 'svelte';
  import { Flame, LoaderCircle, Map as MapIcon, MapPinPlus, RadioTower, RefreshCw, Search, Thermometer, Trash2, Umbrella } from '@lucide/svelte';
  import { searchLocations } from './lib/api/openMeteo';
  import { formatDay, formatHour, formatTemperature, formatUpdated } from './lib/format';
  import WeatherIcon from './lib/WeatherIcon.svelte';
  import { createWeatherGrid } from './lib/stores/weatherGrid.svelte';
  import type { SearchResult } from './lib/types/weather';
  import { describeWeather } from './lib/weatherCodes';

  const grid = createWeatherGrid();
  let query = $state('');
  let results = $state<SearchResult[]>([]);
  let searching = $state(false);
  let searchError = $state('');
  let highlighted = $state(0);
  let searchTimer: ReturnType<typeof setTimeout> | undefined;
  let searchSequence = 0;

  function chooseLocation(location: SearchResult): void { grid.addLocation(location); query = ''; results = []; searchError = ''; }
  function handleSearchInput(): void {
    clearTimeout(searchTimer); searchError = '';
    if (query.trim().length < 2) { results = []; return; }
    const sequence = ++searchSequence;
    searchTimer = setTimeout(async () => {
      searching = true;
      try { const nextResults = await searchLocations(query); if (sequence === searchSequence) { results = nextResults; highlighted = 0; } }
      catch (error: unknown) { if (sequence === searchSequence) searchError = error instanceof Error ? error.message : 'Search failed.'; }
      finally { if (sequence === searchSequence) searching = false; }
    }, 300);
  }
  function handleSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') { event.preventDefault(); highlighted = Math.min(highlighted + 1, results.length - 1); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); highlighted = Math.max(highlighted - 1, 0); }
    else if (event.key === 'Enter' && results[highlighted]) { event.preventDefault(); chooseLocation(results[highlighted]); }
    else if (event.key === 'Escape') results = [];
  }
  function formatStationDistance(distanceMiles: number): string {
    return `${distanceMiles < 10 ? distanceMiles.toFixed(1) : Math.round(distanceMiles)} mi away`;
  }
  function googleMapsUrl(latitude: number, longitude: number): string {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`;
  }
  onMount(() => () => clearTimeout(searchTimer));
</script>

<svelte:head><title>Weather Grid</title><meta name="description" content="A personal grid of live forecasts for the places you care about." /></svelte:head>

<main class="shell">
  <header class="masthead"><div class="brand-lockup"><div class="brand-mark" aria-hidden="true"><img src="/favicon.svg" alt="" /></div><div><p class="eyebrow">Personal forecast system</p><h1>Weather <em>Grid</em></h1></div></div><p class="date-note">One glance.<br /><strong>Everywhere.</strong></p></header>

  <section class="control-deck" aria-label="Weather grid controls">
    <div class="search-wrap"><label for="location-search">Add a location</label><div class="search-field"><Search size={18} aria-hidden="true" /><input id="location-search" type="search" role="combobox" aria-autocomplete="list" aria-controls="location-results" aria-expanded={results.length > 0} placeholder="Search city, water body, or postcode" bind:value={query} oninput={handleSearchInput} onkeydown={handleSearchKeydown} />{#if searching}<LoaderCircle class="spin" size={18} aria-label="Searching" />{/if}</div>
      {#if results.length > 0}<ul id="location-results" class="search-results" role="listbox">{#each results as result, index (result.id)}<li role="option" aria-selected={index === highlighted}><button class:highlighted={index === highlighted} type="button" onclick={() => chooseLocation(result)}><MapPinPlus size={17} aria-hidden="true" /><span><strong>{result.name}</strong><small>{[result.featureType, result.admin1, result.country].filter(Boolean).join(' · ')}</small></span></button></li>{/each}</ul>{:else if query.length >= 2 && !searching && searchError}<p class="search-message error-text">{searchError}</p>{:else if query.length >= 2 && !searching}<p class="search-message">No locations found.</p>{/if}
    </div>
    <div class="settings-panel"><div class="setting-group"><span class="control-label">Show on cards</span><div class="check-row">{#each [['current', 'Current'], ['daily', '5 day'], ['hourly', 'Hourly'], ['stations', 'Station']] as [key, label] (key)}<label class="check-control"><input type="checkbox" checked={grid.settings[key as 'current' | 'daily' | 'hourly' | 'stations']} onchange={() => grid.toggleSection(key as 'current' | 'daily' | 'hourly' | 'stations')} /><span>{label}</span></label>{/each}</div></div><div class="setting-group units-group"><span class="control-label">Temperature</span><div class="unit-switch" role="group" aria-label="Temperature unit"><button class:active={grid.settings.temperatureUnit === 'celsius'} type="button" onclick={() => grid.setUnit('celsius')}>°C</button><button class:active={grid.settings.temperatureUnit === 'fahrenheit'} type="button" onclick={() => grid.setUnit('fahrenheit')}>°F</button></div></div><span class="location-limit" aria-label={`${grid.locations.length} of ${grid.maxLocations} locations used`}>{grid.locations.length}/{grid.maxLocations} places</span><button class="refresh-button" type="button" onclick={grid.refreshAll} aria-label="Refresh all forecasts" title="Refresh all forecasts"><RefreshCw size={17} /></button></div>
  </section>

  <div class="grid-heading"><div><span class="eyebrow">Live locations</span><h2>{grid.locations.length ? `${grid.locations.length} place${grid.locations.length === 1 ? '' : 's'} on your grid` : 'Your weather grid'}</h2></div>{#if grid.locations.length}<span class="updated-label">Updated live</span>{/if}</div>
  <section class="weather-grid" aria-label="Saved location forecasts">
    {#if grid.locations.length === 0}<div class="empty-state"><div class="empty-icon"><MapPinPlus size={30} strokeWidth={1.5} /></div><span class="eyebrow">Start your map</span><h2>Add the places that shape your day.</h2><p>Search above for a city, coastline, or postcode to build your own live forecast grid.</p></div>{/if}
    {#each grid.locations as location (location.id)}
      {@const card = grid.cards[location.id]}{@const forecast = card?.forecast}{@const condition = forecast ? describeWeather(forecast.current.weatherCode) : undefined}
      <article class="weather-card" class:loading-card={card?.loading && !forecast} style={`--weather-color: var(--${condition?.kind ?? 'cloud'});`}><header class="card-header"><div><span class="card-country">{location.countryCode} · {location.admin1 ?? 'Local forecast'}</span><h3>{location.name}</h3></div><div class="card-actions">{#if forecast}<a class="icon-button" href={googleMapsUrl(forecast.latitude, forecast.longitude)} target="_blank" rel="noreferrer" aria-label={`Open ${location.name} forecast coordinates in Google Maps`} title="Open forecast coordinates in Google Maps"><MapIcon size={17} /></a>{/if}<button class="icon-button" type="button" onclick={() => grid.removeLocation(location.id)} aria-label={`Remove ${location.name}`} title={`Remove ${location.name}`}><Trash2 size={17} /></button></div></header>
        {#if card?.error && !forecast}<div class="card-error"><p>Forecast unavailable.</p><small>{card.error}</small><button type="button" onclick={() => grid.retry(location.id)}>Try again</button></div>{:else if !forecast}<div class="skeleton-body"><span></span><span></span><span></span></div>{:else}<div class="card-meta"><span>{forecast.timezone.replaceAll('_', ' ')}</span><span>Updated {formatUpdated(forecast.current.time, forecast.timezone)}</span></div>{#if grid.settings.stations && location.countryCode === 'US'}<section class="weather-station" aria-label="Nearest weather station">{#if card?.stationLoading}<span class="station-pending"><LoaderCircle class="spin" size={14} /> Finding nearest observation station</span>{:else if card?.station}<RadioTower size={17} aria-hidden="true" /><div><span>Nearest observation station</span><strong>{card.station.name}</strong></div><span class="station-distance">{card.station.id} · {formatStationDistance(card.station.distanceMiles)}</span>{:else}<span class="station-unavailable">No nearby observation station available.</span>{/if}</section>{/if}{#if grid.settings.current}<section class="current-section" aria-label="Current conditions"><div class="condition-icon"><WeatherIcon code={forecast.current.weatherCode} size={36} strokeWidth={1.4} /></div><div><strong class="current-temp">{formatTemperature(forecast.current.temperature, forecast.temperatureUnit)}</strong><p>{condition?.label}</p></div><div class="current-meta"><span class="day-high"><Flame size={15} /> High {formatTemperature(forecast.daily[0].high, forecast.temperatureUnit)}</span><span class="feels-like"><Thermometer size={15} /> Feels {formatTemperature(forecast.current.apparentTemperature, forecast.temperatureUnit)}</span></div></section>{/if}{#if grid.settings.daily}<section class="forecast-section" aria-label="Five day forecast"><div class="section-title"><span>Five day outlook</span><Umbrella size={14} /></div><div class="daily-list">{#each forecast.daily as day, index}<div class="daily-row"><strong>{index === 0 ? 'Today' : formatDay(day.date, forecast.timezone)}</strong><WeatherIcon code={day.weatherCode} size={17} strokeWidth={1.7} /><span class="rain-chance">{day.precipitationProbability}%</span><span class="temperatures"><b>{formatTemperature(day.high, forecast.temperatureUnit)}</b> {formatTemperature(day.low, forecast.temperatureUnit)}</span></div>{/each}</div></section>{/if}{#if grid.settings.hourly}<section class="forecast-section hourly-section" aria-label="Hourly forecast"><div class="section-title"><span>Next 10 hours</span><span class="section-hint">Through midday</span></div><div class="hourly-list">{#each forecast.hourly as hour}<div class="hour"><span>{formatHour(hour.time, forecast.timezone)}</span><WeatherIcon code={hour.weatherCode} size={17} strokeWidth={1.7} /><strong>{formatTemperature(hour.temperature, forecast.temperatureUnit)}</strong><small>{hour.precipitationProbability}%</small></div>{/each}</div></section>{/if}{/if}{#if card?.loading && forecast}<div class="refreshing"><LoaderCircle class="spin" size={14} /> Refreshing</div>{/if}</article>
    {/each}
  </section>
  <footer><span>Forecast data by <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a></span><span>Location data by <a href="https://www.geonames.org/" target="_blank" rel="noreferrer">GeoNames</a>, <a href="https://www.usgs.gov/programs/geographic-names-information-system" target="_blank" rel="noreferrer">USGS GNIS</a>, and <a href="https://www.wikidata.org/" target="_blank" rel="noreferrer">Wikidata</a></span><span>Station data by <a href="https://www.weather.gov/documentation/services-web-api" target="_blank" rel="noreferrer">NOAA/NWS</a></span><span aria-hidden="true">·</span><span>Built for the curious</span></footer><div class="sr-only" aria-live="polite">{grid.announce}</div>
</main>
