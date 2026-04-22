import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, AlertCircle, WifiOff, RefreshCw } from "lucide-react";
import { LocationSearch } from "@/components/LocationSearch";
import { CurrentWeather } from "@/components/CurrentWeather";
import { HourlyForecast } from "@/components/HourlyForecast";
import { DailyForecast } from "@/components/DailyForecast";
import { FavoriteLocations } from "@/components/FavoriteLocations";
import { useFavorites } from "@/hooks/use-favorites";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { fetchWeather, reverseGeocode, type GeoLocation, type WeatherData } from "@/lib/weather";
import { saveWeatherCache, readWeatherCache, readLastLocation } from "@/lib/weather-cache";
import { toast } from "sonner";

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
  const [location, setLocation] = useState<GeoLocation>(
    () => readLastLocation() ?? DEFAULT_LOCATION
  );
  const [data, setData] = useState<WeatherData | null>(null);
  const [cachedAt, setCachedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("24h");

  const online = useOnlineStatus();
  const { favorites, isFavorite, toggleFavorite, removeFavorite } = useFavorites();

  const refreshWeather = useCallback(
    async (loc: GeoLocation, opts: { silent?: boolean; userInitiated?: boolean } = {}) => {
      const cached = readWeatherCache(loc);

      if (!navigator.onLine) {
        if (cached) {
          setData(cached.data);
          setCachedAt(cached.fetchedAt);
          setError(null);
          if (opts.userInitiated) toast.info("You're offline — showing saved data");
        } else {
          setError("You're offline and no saved weather exists for this location.");
          if (opts.userInitiated) toast.error("You're offline and no saved data exists");
        }
        return;
      }

      if (opts.silent) setRefreshing(true);
      try {
        const d = await fetchWeather(loc.latitude, loc.longitude, loc.timezone || "auto");
        setData(d);
        setCachedAt(Date.now());
        setError(null);
        saveWeatherCache(loc, d);
        if (opts.userInitiated) toast.success("Weather updated");
      } catch (e) {
        const msg = (e as Error).message || "Failed to load weather";
        if (cached) {
          setData(cached.data);
          setCachedAt(cached.fetchedAt);
          toast.error("Couldn't refresh — showing saved data");
        } else {
          setError(msg);
          if (opts.userInitiated) toast.error(msg);
        }
      } finally {
        if (opts.silent) setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    let cancelled = false;

    const cached = readWeatherCache(location);
    if (cached) {
      setData(cached.data);
      setCachedAt(cached.fetchedAt);
      setLoading(false);
    } else {
      setData(null);
      setCachedAt(null);
      setLoading(true);
    }
    setError(null);

    refreshWeather(location, { silent: !!cached }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [location, online, refreshWeather]);

  const handleRefresh = () => {
    refreshWeather(location, { silent: true, userInitiated: true });
  };

  const handleUseCurrent = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not available in this browser");
      toast.error("Geolocation not supported");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const place = await reverseGeocode(latitude, longitude);
          const next: GeoLocation =
            place ?? {
              id: Date.now(),
              name: "My location",
              country: "",
              latitude,
              longitude,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            };
          setLocation(next);
          toast.success(`Showing weather for ${next.name}`);
        } catch {
          toast.error("Couldn't determine your city");
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Enable it in your browser settings."
            : "Couldn't access your location. Search for a city instead.";
        setError(msg);
        toast.error(msg);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
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
          <div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              title={online ? "Refresh weather" : "Offline — will show cached data"}
              className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-foreground transition hover:text-primary disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              <span>Refresh weather</span>
            </button>
          </div>
        </header>

        {loading && !data && (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!online && (
          <div className="glass mb-4 flex items-center gap-3 rounded-2xl p-4 text-sm">
            <WifiOff className="h-5 w-5 text-primary" />
            <div>
              <div className="font-medium">Offline mode</div>
              <div className="text-xs text-muted-foreground">
                {cachedAt
                  ? `Showing data saved ${new Date(cachedAt).toLocaleString()}`
                  : "Connect to the internet to load weather."}
              </div>
            </div>
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
