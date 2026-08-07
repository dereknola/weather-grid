export function formatTemperature(value: number, unit: string): string {
  return `${Math.round(value)}°${unit === '°F' ? 'F' : 'C'}`;
}

export function formatDay(date: string, timezone: string): string {
  return new Intl.DateTimeFormat('en', { weekday: 'long', timeZone: timezone }).format(new Date(`${date}T12:00:00`));
}

export function formatHour(timestamp: string, timezone: string): string {
  return new Intl.DateTimeFormat('en', { hour: 'numeric', timeZone: timezone }).format(new Date(timestamp));
}

export function formatUpdated(timestamp: string, timezone: string): string {
  return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit', timeZone: timezone }).format(new Date(timestamp));
}