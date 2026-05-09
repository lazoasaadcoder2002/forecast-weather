import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Wind, CloudRain, Thermometer, Zap } from "lucide-react";
import type { GeoLocation, WeatherData } from "@/lib/weather";

interface Props {
  location: GeoLocation;
  data: WeatherData | null;
}

type Alert = {
  id: string;
  level: "info" | "warning" | "severe";
  icon: typeof AlertTriangle;
  title: string;
  detail: string;
};

const levelClasses: Record<Alert["level"], string> = {
  info: "border-primary/30 bg-primary/5 text-primary",
  warning: "border-[hsl(var(--sun)/0.5)] bg-[hsl(var(--sun)/0.08)] text-[hsl(var(--sun))]",
  severe: "border-destructive/40 bg-destructive/10 text-destructive",
};

export const AlarmRadar = ({ location, data }: Props) => {
  const { t } = useTranslation();

  const alerts = useMemo<Alert[]>(() => {
    if (!data) return [];
    const out: Alert[] = [];
    const cur = data.current;
    const today = data.daily;

    const code = cur.weather_code;
    if ([95, 96, 99].includes(code)) {
      out.push({
        id: "storm",
        level: "severe",
        icon: Zap,
        title: t("alarm.alerts.thunderstorm.title"),
        detail: t("alarm.alerts.thunderstorm.detail"),
      });
    }
    if ([65, 67, 82].includes(code) || (today?.precipitation_sum?.[0] ?? 0) > 25) {
      out.push({
        id: "rain",
        level: "warning",
        icon: CloudRain,
        title: t("alarm.alerts.heavyRain.title"),
        detail: t("alarm.alerts.heavyRain.detail"),
      });
    }
    if ([75, 86].includes(code)) {
      out.push({
        id: "snow",
        level: "warning",
        icon: CloudRain,
        title: t("alarm.alerts.heavySnow.title"),
        detail: t("alarm.alerts.heavySnow.detail"),
      });
    }
    if ((cur.wind_speed_10m ?? 0) >= 60) {
      out.push({
        id: "wind",
        level: "severe",
        icon: Wind,
        title: t("alarm.alerts.galeWind.title"),
        detail: t("alarm.alerts.galeWind.detail", { speed: Math.round(cur.wind_speed_10m) }),
      });
    } else if ((cur.wind_speed_10m ?? 0) >= 40) {
      out.push({
        id: "wind",
        level: "warning",
        icon: Wind,
        title: t("alarm.alerts.strongWind.title"),
        detail: t("alarm.alerts.strongWind.detail", { speed: Math.round(cur.wind_speed_10m) }),
      });
    }
    const max = today?.temperature_2m_max?.[0];
    const min = today?.temperature_2m_min?.[0];
    if (typeof max === "number" && max >= 38) {
      out.push({
        id: "heat",
        level: "severe",
        icon: Thermometer,
        title: t("alarm.alerts.extremeHeat.title"),
        detail: t("alarm.alerts.extremeHeat.detail", { temp: Math.round(max) }),
      });
    }
    if (typeof min === "number" && min <= -10) {
      out.push({
        id: "cold",
        level: "warning",
        icon: Thermometer,
        title: t("alarm.alerts.extremeCold.title"),
        detail: t("alarm.alerts.extremeCold.detail", { temp: Math.round(min) }),
      });
    }
    return out;
  }, [data, t]);

  const radarUrl = `https://embed.windy.com/embed2.html?lat=${location.latitude}&lon=${location.longitude}&zoom=6&level=surface&overlay=radar&menu=&message=&marker=true&calendar=&pressure=&type=map&location=coordinates&detail=&detailLat=${location.latitude}&detailLon=${location.longitude}&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-border">
        <iframe
          title="Live weather radar"
          src={radarUrl}
          className="h-[45vh] w-full"
          loading="lazy"
        />
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <AlertTriangle className="h-4 w-4 text-primary" />
          {t("alarm.activeAlerts")} · {location.name}
        </div>
        {alerts.length === 0 ? (
          <div className="glass rounded-xl p-4 text-sm text-muted-foreground">
            {t("alarm.noAlerts")}
          </div>
        ) : (
          <ul className="space-y-2">
            {alerts.map((a) => {
              const Icon = a.icon;
              return (
                <li
                  key={a.id}
                  className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${levelClasses[a.level]}`}
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <div className="font-medium">{a.title}</div>
                    <div className="text-xs opacity-90">{a.detail}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-3 text-[11px] text-muted-foreground">
          {t("alarm.disclaimer")}
        </p>
      </div>
    </div>
  );
};
