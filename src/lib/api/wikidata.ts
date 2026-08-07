import type { SearchResult, WikidataEntityResponse, WikidataSearchResponse } from '../types/weather';

const WIKIDATA_API_URL = 'https://www.wikidata.org/w/api.php';
const waterbodyPattern = /\b(lake|reservoir|river|bay|lagoon|pond|canal|wetland|water body)\b/i;
const unitedStatesPattern = /\b(usa|united states)\b/i;

function featureType(description: string | undefined): string {
  const type = description?.split(/\s+in\s+/i)[0] ?? 'Water feature';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

async function fetchJson<T>(url: URL, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Wikidata search failed with status ${response.status}`);
  return response.json() as Promise<T>;
}

export async function searchWaterFeatureAliases(query: string, signal?: AbortSignal): Promise<SearchResult[]> {
  const name = query.split(',')[0].trim();
  if (name.length < 2) return [];

  const searchUrl = new URL(WIKIDATA_API_URL);
  searchUrl.search = new URLSearchParams({ action: 'wbsearchentities', search: name, language: 'en', format: 'json', origin: '*' }).toString();
  const searchResponse = await fetchJson<WikidataSearchResponse>(searchUrl, signal);
  const candidates = (searchResponse.search ?? []).filter((candidate) => {
    const description = candidate.description;
    if (!description) return false;
    return waterbodyPattern.test(description) && unitedStatesPattern.test(description);
  }).slice(0, 3);

  const results: Array<SearchResult | undefined> = await Promise.all(candidates.map(async (candidate) => {
    const entityUrl = new URL(WIKIDATA_API_URL);
    entityUrl.search = new URLSearchParams({ action: 'wbgetentities', ids: candidate.id, props: 'claims', format: 'json', origin: '*' }).toString();
    const entityResponse = await fetchJson<WikidataEntityResponse>(entityUrl, signal);
    const coordinates = entityResponse.entities?.[candidate.id]?.claims?.P625?.[0]?.mainsnak?.datavalue?.value;
    const id = Number(candidate.id.slice(1));
    if (!Number.isFinite(id) || typeof coordinates?.latitude !== 'number' || typeof coordinates.longitude !== 'number') return undefined;

    return {
      id: -1_000_000_000 - id,
      name: candidate.label,
      country: 'United States',
      countryCode: 'US',
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      timezone: 'auto',
      featureType: featureType(candidate.description)
    };
  }));

  return results.filter((result): result is SearchResult => result !== undefined);
}
