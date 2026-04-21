import { Droplets, Wind, Sun as SunIcon, Thermometer, Star } from "lucide-react";
import { WeatherIcon } from "./WeatherIcon";
import { describeWeather, iconForCode, type GeoLocation, type WeatherData } from "@/lib/weather";

interface Props {
  location: GeoLocation;
  data: WeatherData;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const CurrentWeather = ({ location, data, isFavorite, onToggleFavorite }: Props) => {
  const c = data.current;
  const icon = iconForCode(c.weatherCode, c.isDay);
  const localTime = new Date(c.time).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", timeZone: data.timezone,
  });
  const localDate = new Date(c.time).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", timeZone: data.timezone,
  });

  return (
    <section className="glass-strong relative overflow-hidden rounded-[2rem] p-6 sm:p-10 animate-fade-in-up">
      {/* Sun glow background */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gradient-sun opacity-20 blur-3xl animate-pulse-glow" />

      <div className="relative flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            {localTime} · local
          </div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-4xl font-medium leading-tight sm:text-5xl">
              {location.name}
            </h1>
            {onToggleFavorite && (
              <button
                onClick={onToggleFavorite}
                title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
                  isFavorite
                    ? "bg-primary/20 text-primary shadow-glow"
                    : "bg-secondary/60 text-muted-foreground hover:text-primary"
                }`}
              >
                <Star
                  className="h-5 w-5"
                  strokeWidth={1.75}
                  fill={isFavorite ? "currentColor" : "none"}
                />
              </button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {[location.admin1, location.country].filter(Boolean).join(", ")} · {localDate}
          </p>

          <div className="flex items-end gap-4 pt-4">
            <div className="font-display text-7xl font-medium tracking-tighter text-gradient-sun sm:text-8xl">
              {Math.round(c.temperature)}°
            </div>
            <div className="pb-3 text-lg text-foreground/80">{describeWeather(c.weatherCode)}</div>
          </div>
          <p className="text-sm text-muted-foreground">
            Feels like {Math.round(c.apparentTemperature)}°
          </p>
        </div>

        <div className="flex justify-center">
          <WeatherIcon name={icon} glow className="h-40 w-40 animate-float sm:h-56 sm:w-56" />
        </div>
      </div>

      <div className="relative mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<Thermometer className="h-4 w-4" />} label="Feels like" value={`${Math.round(c.apparentTemperature)}°`} />
        <Stat icon={<Droplets className="h-4 w-4" />} label="Humidity" value={`${c.humidity}%`} />
        <Stat icon={<Wind className="h-4 w-4" />} label="Wind" value={`${Math.round(c.windSpeed)} km/h`} />
        <Stat icon={<SunIcon className="h-4 w-4" />} label="UV index" value={`${Math.round(c.uvIndex ?? 0)}`} />
      </div>
    </section>
  );
};

const Stat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="rounded-2xl border border-border/40 bg-secondary/30 p-4 backdrop-blur">
    <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
      {icon}
      {label}
    </div>
    <div className="mt-2 font-display text-2xl">{value}</div>
  </div>
);
