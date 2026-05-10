import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import i18n from "@/i18n";
import { describeWeather, type GeoLocation, type WeatherData } from "./weather";

const STORAGE_KEY = "skyline:notif-state";

type NotifState = {
  lastCurrentKey?: string; // location|tempRounded|code|hour
  firedAlertIds?: string[]; // location|alertId
};

const isNative = () =>
  typeof Capacitor !== "undefined" && Capacitor.isNativePlatform?.() === true;

const readState = (): NotifState => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
};
const writeState = (s: NotifState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
};

let permissionRequested = false;
async function ensurePermission(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display === "granted") return true;
    if (permissionRequested) return false;
    permissionRequested = true;
    const req = await LocalNotifications.requestPermissions();
    return req.display === "granted";
  } catch {
    return false;
  }
}

export async function notifyCurrentWeather(
  location: GeoLocation,
  data: WeatherData
) {
  if (!isNative()) return;
  if (!(await ensurePermission())) return;

  const cur = data.current;
  const temp = Math.round(cur.temperature);
  const desc = describeWeather(cur.weatherCode);
  const hour = new Date().getHours();
  const key = `${location.latitude.toFixed(2)},${location.longitude.toFixed(2)}|${temp}|${cur.weatherCode}|${hour}`;

  const state = readState();
  if (state.lastCurrentKey === key) return; // dedupe within the same hour
  state.lastCurrentKey = key;
  writeState(state);

  const t = i18n.t.bind(i18n);
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 1001,
          title: `${desc} · ${temp}°`,
          body: `${location.name} · ${t("current.feelsLikeFull", { temp: Math.round(cur.apparentTemperature) })}`,
          smallIcon: "ic_stat_icon_config_sample",
        },
      ],
    });
  } catch {
    /* ignore */
  }
}

export type WeatherAlertNotice = {
  id: string;
  title: string;
  detail: string;
};

export async function notifyAlerts(
  location: GeoLocation,
  alerts: WeatherAlertNotice[]
) {
  if (!isNative()) return;
  if (alerts.length === 0) return;
  if (!(await ensurePermission())) return;

  const state = readState();
  const fired = new Set(state.firedAlertIds || []);
  const locKey = `${location.latitude.toFixed(2)},${location.longitude.toFixed(2)}`;
  const fresh = alerts.filter((a) => !fired.has(`${locKey}|${a.id}`));
  if (fresh.length === 0) return;

  fresh.forEach((a) => fired.add(`${locKey}|${a.id}`));
  state.firedAlertIds = Array.from(fired).slice(-50);
  writeState(state);

  try {
    await LocalNotifications.schedule({
      notifications: fresh.map((a, idx) => ({
        id: 2000 + idx + Math.floor(Math.random() * 1000),
        title: `⚠️ ${a.title}`,
        body: `${location.name} · ${a.detail}`,
        smallIcon: "ic_stat_icon_config_sample",
      })),
    });
  } catch {
    /* ignore */
  }
}
