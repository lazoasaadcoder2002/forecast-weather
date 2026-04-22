import type { GeoLocation, WeatherData } from "./weather";

const PREFIX = "skyline:weather-cache:";
const LAST_KEY = "skyline:last-location";

export interface CachedWeather {
  location: GeoLocation;
  data: WeatherData;
  fetchedAt: number; // epoch ms
}

const keyFor = (loc: Pick<GeoLocation, "latitude" | "longitude">) =>
  `${PREFIX}${loc.latitude.toFixed(3)},${loc.longitude.toFixed(3)}`;

export function saveWeatherCache(location: GeoLocation, data: WeatherData) {
  try {
    const payload: CachedWeather = { location, data, fetchedAt: Date.now() };
    localStorage.setItem(keyFor(location), JSON.stringify(payload));
    localStorage.setItem(LAST_KEY, JSON.stringify(location));
  } catch {
    // ignore quota / serialization errors
  }
}

export function readWeatherCache(
  location: Pick<GeoLocation, "latitude" | "longitude">
): CachedWeather | null {
  try {
    const raw = localStorage.getItem(keyFor(location));
    if (!raw) return null;
    return JSON.parse(raw) as CachedWeather;
  } catch {
    return null;
  }
}

export function readLastLocation(): GeoLocation | null {
  try {
    const raw = localStorage.getItem(LAST_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GeoLocation;
  } catch {
    return null;
  }
}
