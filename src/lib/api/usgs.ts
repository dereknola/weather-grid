import type { SearchResult, UsgsWaterFeaturesResponse } from '../types/weather';
import { searchWaterFeatureAliases } from './wikidata';

const USGS_WATER_FEATURES_URL = 'https://carto.nationalmap.gov/arcgis/rest/services/geonames/MapServer/7/query';

const stateCodes: Record<string, string> = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA', colorado: 'CO', connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA', hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA', kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD', massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS', missouri: 'MO', montana: 'MT', nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH', oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC', 'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT', virginia: 'VA', washington: 'WA', 'west virginia': 'WV', wisconsin: 'WI', wyoming: 'WY'
};

const stateNames = Object.fromEntries(Object.entries(stateCodes).map(([name, code]) => [code, name.replace(/\b\w/g, (letter) => letter.toUpperCase())]));

function searchTerms(query: string): { name: string; stateCode?: string } {
  const [name, ...qualifiers] = query.split(',').map((part) => part.trim());
  const stateCode = qualifiers.map((qualifier) => stateCodes[qualifier.toLowerCase()] ?? (qualifier.length === 2 ? qualifier.toUpperCase() : undefined)).find(Boolean);
  return { name, stateCode };
}

export async function searchWaterFeatures(query: string, signal?: AbortSignal): Promise<SearchResult[]> {
  const { name, stateCode } = searchTerms(query);
  if (name.length < 2) return [];

  const url = new URL(USGS_WATER_FEATURES_URL);
  const escapedName = name.replaceAll("'", "''");
  url.searchParams.set('where', `gaz_name LIKE '${escapedName}%'${stateCode ? ` AND state_alpha = '${stateCode}'` : ''}`);
  url.searchParams.set('outFields', 'gaz_id,gaz_name,gaz_featureclass,state_alpha,county_name');
  url.searchParams.set('returnGeometry', 'true');
  url.searchParams.set('outSR', '4326');
  url.searchParams.set('resultRecordCount', '8');
  url.searchParams.set('f', 'json');

  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`USGS water search failed with status ${response.status}`);
  const body = (await response.json()) as UsgsWaterFeaturesResponse;

  const features = (body.features ?? []).flatMap((feature) => {
    const id = feature.attributes?.gaz_id;
    const name = feature.attributes?.gaz_name;
    const latitude = feature.geometry?.y;
    const longitude = feature.geometry?.x;
    if (!id || !name || typeof latitude !== 'number' || typeof longitude !== 'number') return [];

    const stateCode = feature.attributes?.state_alpha;
    return [{
      id: -id,
      name,
      country: 'United States',
      countryCode: 'US',
      admin1: stateCode ? stateNames[stateCode] : undefined,
      latitude,
      longitude,
      timezone: 'auto',
      featureType: feature.attributes?.gaz_featureclass ?? 'Water feature'
    }];
  });
  return features.length ? features : searchWaterFeatureAliases(query, signal);
}
