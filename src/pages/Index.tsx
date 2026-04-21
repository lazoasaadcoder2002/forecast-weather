import { useEffect, useMemo, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { LocationSearch } from "@/components/LocationSearch";
import { CurrentWeather } from "@/components/CurrentWeather";
import { HourlyForecast } from "@/components/HourlyForecast";
import { DailyForecast } from "@/components/DailyForecast";
import { FavoriteLocations } from "@/components/FavoriteLocations";
import { useFavorites } from "@/hooks/use-favorites";
import { fetchWeather, reverseGeocode, type GeoLocation, type WeatherData } from "@/lib/weather";

type Tab = "24h" | "5d" | "10d";

const DEFAULT_LOCATION: GeoLocation = {
  id: 2643743,
  name: "London",
  country: "United Kingdom",
  admin1: "England",
  latitude: 51.5074,
  longitude: -0.1278,
  timezone: "Europe/London",
};

const Index = () => {
  const [location, setLocation] = useState<GeoLocation>(DEFAULT_LOCATION);
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("24h");

  const { favorites, isFavorite, toggleFavorite, removeFavorite } = useFavorites();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchWeather(location.latitude, location.longitude, location.timezone || "auto")
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e.message || "Failed to load weather"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [location]);

  const handleUseCurrent = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not available in this browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const place = await reverseGeocode(latitude, longitude);
        setLocation(
          place ?? {
            id: Date.now(),
            name: "My location",
            country: "",
            latitude,
            longitude,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }
        );
        setLocating(false);
      },
      () => {
        setError("Couldn't access your location. Search for a city instead.");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  const tabs = useMemo(
    () => [
      { id: "24h" as Tab, label: "Hourly" },
      { id: "5d" as Tab, label: "5 days" },
      { id: "10d" as Tab, label: "10 days" },
    ],
    []
  );

  return (
    <main className="relative min-h-screen">
      {/* Ambient orbs */}
      <div className="pointer-events-none fixed left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[hsl(var(--sun)/0.08)] blur-[120px]" />
      <div className="pointer-events-none fixed -bottom-40 right-0 h-[400px] w-[400px] rounded-full bg-[hsl(var(--accent)/0.1)] blur-[120px]" />

      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-8 flex flex-col gap-6 sm:mb-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-sun shadow-glow" />
              <span className="font-display text-xl font-medium">Skyline</span>
            </div>
            <span className="hidden text-xs uppercase tracking-[0.25em] text-muted-foreground sm:block">
              Worldwide forecasts
            </span>
          </div>
          <LocationSearch onSelect={setLocation} onUseCurrent={handleUseCurrent} loadingCurrent={locating} />
          <FavoriteLocations
            favorites={favorites}
            activeId={location.id}
            onSelect={setLocation}
            onRemove={removeFavorite}
          />
        </header>

        {loading && !data && (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="glass mb-6 flex items-center gap-3 rounded-2xl p-4 text-sm">
            <AlertCircle className="h-5 w-5 text-destructive" />
            {error}
          </div>
        )}

        {data && (
          <div className="space-y-6">
            <CurrentWeather
              location={location}
              data={data}
              isFavorite={isFavorite(location)}
              onToggleFavorite={() => toggleFavorite(location)}
            />

            <div className="glass inline-flex rounded-full p-1.5">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                    tab === t.id
                      ? "bg-gradient-sun text-primary-foreground shadow-glow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "24h" && <HourlyForecast data={data} hours={24} />}
            {tab === "5d" && <DailyForecast data={data} days={5} />}
            {tab === "10d" && <DailyForecast data={data} days={10} />}

            {tab !== "24h" && <HourlyForecast data={data} hours={24} />}
          </div>
        )}

        <footer className="mt-12 text-center text-xs text-muted-foreground">
          Weather data by <a href="https://open-meteo.com" target="_blank" rel="noreferrer" className="underline hover:text-primary">Open-Meteo</a>
        </footer>
      </div>
    </main>
  );
};

export default Index;
