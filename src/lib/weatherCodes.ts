export type WeatherKind = 'clear' | 'cloud' | 'fog' | 'rain' | 'snow' | 'storm' | 'unknown';

export type WeatherDescription = {
  label: string;
  kind: WeatherKind;
};

export function describeWeather(code: number): WeatherDescription {
  if (code === 0) return { label: 'Clear sky', kind: 'clear' };
  if ([1, 2, 3].includes(code)) return { label: 'Cloudy', kind: 'cloud' };
  if ([45, 48].includes(code)) return { label: 'Fog', kind: 'fog' };
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label: 'Rain', kind: 'rain' };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: 'Snow', kind: 'snow' };
  if ([95, 96, 99].includes(code)) return { label: 'Storm', kind: 'storm' };
  return { label: 'Changing conditions', kind: 'unknown' };
}