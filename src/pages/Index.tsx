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

  const showPermissionInstructions = () => {
    const ua = navigator.userAgent.toLowerCase();
    let steps = "Open your browser settings → Site settings → Location, and allow access for this site.";
    if (ua.includes("chrome") && !ua.includes("edg")) {
      steps = "Click the lock icon (🔒) in the address bar → Site settings → set Location to Allow → reload the page.";
    } else if (ua.includes("safari")) {
      steps = "Open Safari → Settings → Websites → Location → set this site to Allow. Then reload.";
    } else if (ua.includes("firefox")) {
      steps = "Click the lock icon (🔒) in the address bar → Clear the blocked Location permission → reload and allow when prompted.";
    } else if (ua.includes("edg")) {
      steps = "Click the lock icon (🔒) in the address bar → Permissions for this site → set Location to Allow → reload.";
    }
    setError(`Location access is blocked. ${steps}`);
    toast.error("Please enable location in your browser settings", {
      description: steps,
      duration: 8000,
    });
  };

  const handleUseCurrent = async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not available in this browser");
      toast.error("Geolocation not supported");
      return;
    }

    // Check permission state first — if already denied, guide the user to settings
    if (navigator.permissions?.query) {
      try {
        const status = await navigator.permissions.query({ name: "geolocation" as PermissionName });
        if (status.state === "denied") {
          showPermissionInstructions();
          return;
        }
      } catch {
        // Permissions API not supported here — fall through to getCurrentPosition
      }
    }

    setLocating(true);
    setError(null);

    // Manual timeout — some embedded/iframe contexts never invoke the
    // geolocation callbacks, leaving the spinner stuck forever.
    let settled = false;
    const timeoutId = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      setLocating(false);
      const msg =
        "Couldn't get your location. If you're viewing inside a preview frame, try opening the app in a new tab, or search for your city.";
      setError(msg);
      toast.error("Location request timed out");
    }, 12000);

    const handleSuccess = async (pos: GeolocationPosition) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
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
        // Still set the raw coordinates so weather can load even if reverse-geocode fails
        setLocation({
          id: Date.now(),
          name: "My location",
          country: "",
          latitude,
          longitude,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
        toast.success("Showing weather for your location");
      } finally {
        setLocating(false);
      }
    };

    const handleError = (err: GeolocationPositionError) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      const msg =
        err.code === err.PERMISSION_DENIED
          ? "Location permission denied. Enable it in your browser settings."
          : err.code === err.POSITION_UNAVAILABLE
          ? "Your location is unavailable right now. Try again or search for a city."
          : err.code === err.TIMEOUT
          ? "Getting your location took too long. Try again."
          : "Couldn't access your location. Search for a city instead.";
      setError(msg);
      toast.error(msg);
      setLocating(false);
    };

    try {
      navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      });
    } catch (e) {
      settled = true;
      window.clearTimeout(timeoutId);
      setLocating(false);
      const msg = (e as Error).message || "Couldn't access your location.";
      setError(msg);
      toast.error(msg);
    }
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
              <span>Refresh</span>
            </button>
            {cachedAt && (
              <span className="ml-3 text-xs text-muted-foreground">
                Last updated: {new Date(cachedAt).toLocaleString()}
              </span>
            )}
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
