import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Thermometer, Star, Droplets, Wind, Sun as SunIcon } from "lucide-react";
import { WeatherIcon } from "./WeatherIcon";
import { describeWeather, iconForCode, formatLocaleTime, formatDay, type GeoLocation, type WeatherData } from "@/lib/weather";
import heroSunset from "@/assets/hero-sunset.jpg";

interface Props {
  location: GeoLocation;
  data: WeatherData;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const CurrentWeather = ({ location, data, isFavorite, onToggleFavorite }: Props) => {
  const { t, i18n } = useTranslation();
  const c = data.current;
  const icon = iconForCode(c.weatherCode, c.isDay);

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  void i18n.language;

  const localTime = formatLocaleTime(now, data.timezone);
  const localDate = new Date().toLocaleDateString(i18n.language, {
    weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: data.timezone,
  });

  const miniDays = data.daily.time.slice(0, 4).map((time, i) => ({
    time,
    code: data.daily.weatherCode[i],
    max: data.daily.tempMax[i],
    min: data.daily.tempMin[i],
    isDay: 1,
  }));

  return (
    <section className="relative overflow-hidden rounded-[2rem] shadow-deep animate-fade-in-up">
      {/* Background image */}
      <img
        src={heroSunset}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
        width={1024}
        height={1280}
      />
      {/* Purple wash + bottom darken */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(258_70%_18%/0.55)] via-[hsl(275_55%_30%/0.35)] to-[hsl(258_70%_14%/0.85)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[hsl(258_70%_12%/0.85)] to-transparent" />

      <div className="relative p-6 sm:p-8">
        {/* Top meta */}
        <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.18em] text-white/85">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--sun))] shadow-glow animate-pulse" />
            {localTime}
          </span>
          <span className="text-white/40">|</span>
          <span>{t("current.local")}</span>
        </div>

        {/* City + favorite */}
        <div className="mt-3 flex items-center gap-3">
          <h1 className="font-display text-[42px] font-medium leading-none text-white sm:text-[56px]">
            {location.name}
          </h1>
          {onToggleFavorite && (
            <button
              onClick={onToggleFavorite}
              title={isFavorite ? t("current.removeFav") : t("current.addFav")}
              className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/20 backdrop-blur transition ${
                isFavorite ? "bg-[hsl(var(--sun)/0.25)] text-[hsl(var(--sun))]" : "bg-white/10 text-white/90 hover:bg-white/15"
              }`}
            >
              <Star className="h-4 w-4" strokeWidth={1.75} fill={isFavorite ? "currentColor" : "none"} />
            </button>
          )}
        </div>

        <p className="mt-2 text-sm text-white/85">
          {[location.admin1, location.country].filter(Boolean).join(", ")}
        </p>
        <p className="text-sm text-white/75">{localDate}</p>

        {/* Temperature block */}
        <div className="mt-7 grid grid-cols-[1fr_auto] items-end gap-4">
          <div>
            <div className="font-display font-medium tracking-tighter text-gradient-sun text-[96px] leading-[0.9] sm:text-[120px]">
              {Math.round(c.temperature)}°
            </div>
            <div className="mt-2 text-lg font-medium text-white">{describeWeather(c.weatherCode)}</div>
          </div>
          <div className="pb-2">
            <WeatherIcon name={icon} glow className="h-24 w-24 drop-shadow-2xl sm:h-32 sm:w-32" />
          </div>
        </div>

        <div className="my-5 h-px w-full bg-white/15" />

        <div className="flex items-center gap-2 text-sm text-white/90">
          <Thermometer className="h-4 w-4 text-[hsl(var(--sun))]" />
          {t("current.feelsLikeFull", { temp: Math.round(c.apparentTemperature) })}
        </div>

        {/* Inline mini stats */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <MiniStat icon={<Droplets className="h-3.5 w-3.5" />} label={t("current.humidity")} value={`${c.humidity}%`} />
          <MiniStat icon={<Wind className="h-3.5 w-3.5" />} label={t("current.wind")} value={`${Math.round(c.windSpeed)} km/h`} />
          <MiniStat icon={<SunIcon className="h-3.5 w-3.5" />} label={t("current.uvIndex")} value={`${Math.round(c.uvIndex ?? 0)}`} />
        </div>

        {/* Mini 4-day */}
        <div className="glass-inner mt-5 grid grid-cols-4 gap-2 rounded-2xl p-3">
          {miniDays.map((d, i) => (
            <div key={d.time} className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
                {i === 0 ? t("daily.today") : formatDay(d.time, data.timezone)}
              </span>
              <WeatherIcon name={iconForCode(d.code, 1)} className="h-7 w-7" />
              <span className="text-[11px] text-white/90">
                {Math.round(d.max)}° / {Math.round(d.min)}°
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const MiniStat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="glass-inner rounded-xl px-3 py-2">
    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/65">
      {icon}
      {label}
    </div>
    <div className="mt-0.5 text-sm font-medium text-white">{value}</div>
  </div>
);
