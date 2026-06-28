import { useTranslation } from "react-i18next";
import { Droplets } from "lucide-react";
import { WeatherIcon } from "./WeatherIcon";
import { describeWeather, formatDay, iconForCode, type WeatherData } from "@/lib/weather";

interface Props { data: WeatherData; days: number; }

export const DailyForecast = ({ data, days }: Props) => {
  const { t, i18n } = useTranslation();
  void i18n.language;
  const items = data.daily.time.slice(0, days).map((time, i) => ({
    time,
    code: data.daily.weatherCode[i],
    max: data.daily.tempMax[i],
    min: data.daily.tempMin[i],
    pop: data.daily.precipitationProbabilityMax[i] ?? 0,
  }));

  const allMin = Math.min(...items.map((d) => d.min));
  const allMax = Math.max(...items.map((d) => d.max));
  const range = Math.max(1, allMax - allMin);

  return (
    <section className="glass rounded-[2rem] p-6 animate-fade-in-up" style={{ animationDelay: "160ms" }}>
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="font-display text-2xl font-medium">{t("daily.outlook", { days })}</h2>
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          {Math.round(allMin)}° – {Math.round(allMax)}°
        </span>
      </div>
      <ul className="divide-y divide-border/40">
        {items.map((d, i) => {
          const leftPct = ((d.min - allMin) / range) * 100;
          const widthPct = ((d.max - d.min) / range) * 100;
          return (
            <li key={d.time} className="grid grid-cols-[64px_36px_1fr_120px] items-center gap-3 py-3 sm:grid-cols-[88px_44px_1fr_160px] sm:gap-4">
              <span className="text-sm font-medium text-foreground/90">
                {i === 0 ? t("daily.today") : formatDay(d.time, data.timezone)}
              </span>
              <WeatherIcon name={iconForCode(d.code, 1)} className="h-7 w-7" />
              <div className="hidden text-sm text-muted-foreground sm:block">
                {describeWeather(d.code)}
              </div>
              <div className="flex items-center gap-2 sm:col-start-4">
                <span className="w-8 text-right text-sm text-muted-foreground">{Math.round(d.min)}°</span>
                <div className="relative h-1.5 flex-1 rounded-full bg-secondary/60">
                  <div
                    className="absolute h-1.5 rounded-full bg-gradient-sun"
                    style={{ left: `${leftPct}%`, width: `${Math.max(4, widthPct)}%` }}
                  />
                </div>
                <span className="w-8 text-sm font-medium">{Math.round(d.max)}°</span>
              </div>
              <div className="col-span-4 -mt-1 flex items-center gap-1 pl-[100px] text-[11px] text-[hsl(var(--sky))] sm:hidden">
                <Droplets className="h-3 w-3" /> {d.pop}%
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
