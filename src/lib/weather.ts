// Open-Meteo helpers — free, no API key required.

export interface GeoLocation {
  id: number;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface WeatherData {
  current: {
    time: string;
    temperature: number;
    apparentTemperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    weatherCode: number;
    isDay: number;
    precipitation: number;
    uvIndex: number;
  };
  hourly: {
    time: string[];
    temperature: number[];
    weatherCode: number[];
    precipitationProbability: number[];
    isDay: number[];
  };
  daily: {
    time: string[];
    weatherCode: number[];
    tempMax: number[];
    tempMin: number[];
    precipitationProbabilityMax: number[];
    sunrise: string[];
    sunset: string[];
    windSpeedMax: number[];
    uvIndexMax: number[];
  };
  timezone: string;
}

export async function ipGeolocate(): Promise<GeoLocation | null> {
  // Free, no key, no permission required. Approximate (city-level).
  try {
    const res = await fetch("https://ipapi.co/json/");
    if (!res.ok) return null;
    const d = await res.json();
    if (typeof d.latitude !== "number" || typeof d.longitude !== "number") return null;
    return {
      id: Date.now(),
      name: d.city || d.region || "My location",
      country: d.country_name || "",
      admin1: d.region || undefined,
      latitude: d.latitude,
      longitude: d.longitude,
      timezone: d.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  } catch {
    return null;
  }
}

export async function searchLocations(query: string): Promise<GeoLocation[]> {
  if (!query.trim()) return [];
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    query
  )}&count=8&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to search locations");
  const data = await res.json();
  return (data.results || []) as GeoLocation[];
}

export async function reverseGeocode(lat: number, lon: number): Promise<GeoLocation | null> {
  // Try BigDataCloud first — free, no key, reliable worldwide reverse geocoding.
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const res = await fetch(url);
    if (res.ok) {
      const d = await res.json();
      const name =
        d.city || d.locality || d.localityInfo?.administrative?.[3]?.name || d.principalSubdivision || "My location";
      if (name) {
        return {
          id: Math.round((lat + 90) * 1e4) * 1e6 + Math.round((lon + 180) * 1e4),
          name,
          country: d.countryName || "",
          admin1: d.principalSubdivision || undefined,
          latitude: lat,
          longitude: lon,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
      }
    }
  } catch {
    // fall through to Open-Meteo
  }

  // Fallback: Open-Meteo reverse (limited coverage)
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function fetchWeather(lat: number, lon: number, timezone = "auto"): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current:
      "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,is_day,precipitation,uv_index",
    hourly: "temperature_2m,weather_code,precipitation_probability,is_day",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,wind_speed_10m_max,uv_index_max",
    timezone,
    forecast_days: "16",
    forecast_hours: "48",
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error("Failed to fetch weather");
  const d = await res.json();
  return {
    timezone: d.timezone,
    current: {
      time: d.current.time,
      temperature: d.current.temperature_2m,
      apparentTemperature: d.current.apparent_temperature,
      humidity: d.current.relative_humidity_2m,
      windSpeed: d.current.wind_speed_10m,
      windDirection: d.current.wind_direction_10m,
      weatherCode: d.current.weather_code,
      isDay: d.current.is_day,
      precipitation: d.current.precipitation,
      uvIndex: d.current.uv_index,
    },
    hourly: {
      time: d.hourly.time,
      temperature: d.hourly.temperature_2m,
      weatherCode: d.hourly.weather_code,
      precipitationProbability: d.hourly.precipitation_probability,
      isDay: d.hourly.is_day,
    },
    daily: {
      time: d.daily.time,
      weatherCode: d.daily.weather_code,
      tempMax: d.daily.temperature_2m_max,
      tempMin: d.daily.temperature_2m_min,
      precipitationProbabilityMax: d.daily.precipitation_probability_max,
      sunrise: d.daily.sunrise,
      sunset: d.daily.sunset,
      windSpeedMax: d.daily.wind_speed_10m_max,
      uvIndexMax: d.daily.uv_index_max,
    },
  };
}

// WMO weather interpretation codes — translated via i18n keys (weather.<code>)
import i18n from "@/i18n";

export function describeWeather(code: number): string {
  const key = `weather.${code}`;
  const translated = i18n.t(key);
  return translated === key ? i18n.t("weather.unknown") : translated;
}

export type WeatherIconName =
  | "sun" | "moon" | "cloud-sun" | "cloud-moon" | "cloud" | "clouds"
  | "fog" | "drizzle" | "rain" | "snow" | "storm";

export function iconForCode(code: number, isDay = 1): WeatherIconName {
  if (code === 0) return isDay ? "sun" : "moon";
  if (code === 1 || code === 2) return isDay ? "cloud-sun" : "cloud-moon";
  if (code === 3) return "clouds";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 95) return "storm";
  return "cloud";
}

const localeFor = () => {
  const l = (i18n.language || "en").toLowerCase();
  // Map our codes to BCP-47 locales (most match directly).
  const map: Record<string, string> = { fil: "fil-PH", zh: "zh-CN", ar: "ar", ur: "ur-PK", uk: "uk-UA" };
  return map[l] ?? l;
};

export function formatHour(iso: string, timezone: string): string {
  return new Date(iso).toLocaleTimeString(localeFor(), {
    hour: "numeric",
    timeZone: timezone,
  });
}

export function formatDay(iso: string, timezone: string, opts: Intl.DateTimeFormatOptions = { weekday: "short" }): string {
  return new Date(iso).toLocaleDateString(localeFor(), { ...opts, timeZone: timezone });
}

export function formatLocaleTime(date: Date, timezone: string): string {
  return date.toLocaleTimeString(localeFor(), { hour: "numeric", minute: "2-digit", timeZone: timezone });
}

export function formatLocaleDate(date: Date, timezone: string): string {
  return date.toLocaleDateString(localeFor(), { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: timezone });
}
