import { Droplets } from "lucide-react";
import { WeatherIcon } from "./WeatherIcon";
import { formatHour, iconForCode, type WeatherData } from "@/lib/weather";

interface Props { data: WeatherData; hours?: number; }

export const HourlyForecast = ({ data, hours = 24 }: Props) => {
  const now = Date.now();
  const items = data.hourly.time
    .map((t, i) => ({
      time: t,
      temp: data.hourly.temperature[i],
      code: data.hourly.weatherCode[i],
      pop: data.hourly.precipitationProbability[i] ?? 0,
      isDay: data.hourly.isDay[i],
    }))
    .filter((h) => new Date(h.time).getTime() >= now - 1000 * 60 * 30)
    .slice(0, hours);

  return (
    <section className="glass rounded-[2rem] p-6 animate-fade-in-up" style={{ animationDelay: "80ms" }}>
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="font-display text-2xl font-medium">Next {hours} hours</h2>
        <span className="text-xs uppercase tracking-wider text-muted-foreground">scroll →</span>
      </div>
      <div className="scrollbar-hide -mx-2 flex gap-2 overflow-x-auto px-2 pb-2">
        {items.map((h, i) => (
          <div
            key={h.time}
            className="flex min-w-[78px] flex-col items-center gap-2 rounded-2xl border border-border/30 bg-secondary/20 p-3 backdrop-blur transition hover:border-primary/40 hover:bg-secondary/40"
          >
            <span className="text-xs font-medium text-muted-foreground">
              {i === 0 ? "Now" : formatHour(h.time, data.timezone)}
            </span>
            <WeatherIcon name={iconForCode(h.code, h.isDay)} className="h-8 w-8" />
            <span className="font-display text-lg">{Math.round(h.temp)}°</span>
            <span className="flex items-center gap-1 text-[10px] text-[hsl(var(--sky))]">
              <Droplets className="h-3 w-3" />
              {h.pop}%
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};
