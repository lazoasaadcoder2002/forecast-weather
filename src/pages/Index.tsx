import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, AlertCircle, WifiOff, RefreshCw, Menu, Star, MapPin, Info, ExternalLink, Map as MapIcon, Globe2, Languages } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { WeatherMap } from "@/components/WeatherMap";
import { EUROPEAN_CAPITALS, ARABIC_CAPITALS } from "@/lib/regions";
import { LANGUAGES } from "@/i18n";
import { LocationSearch } from "@/components/LocationSearch";
import { CurrentWeather } from "@/components/CurrentWeather";
import { HourlyForecast } from "@/components/HourlyForecast";
import { DailyForecast } from "@/components/DailyForecast";
import { FavoriteLocations } from "@/components/FavoriteLocations";
import { useFavorites } from "@/hooks/use-favorites";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { fetchWeather, reverseGeocode, ipGeolocate, type GeoLocation, type WeatherData } from "@/lib/weather";
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
  const { t, i18n } = useTranslation();
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
  const [mapOpen, setMapOpen] = useState(false);

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

  const useIpFallback = async (notify = true): Promise<boolean> => {
    const place = await ipGeolocate();
    if (place) {
      setLocation(place);
      setError(null);
      if (notify) toast.success(`Approximate location: ${place.name}`);
      return true;
    }
    return false;
  };

  const handleUseCurrent = async () => {
    setLocating(true);
    setError(null);

    // 1) Prefer precise GPS coordinates (accurate to the user's actual position).
    //    IP-based lookups often resolve to the ISP's datacenter (e.g. Kabul) and
    //    must only be used when GPS is unavailable or denied.
    if (!navigator.geolocation) {
      if (await useIpFallback(true)) {
        setLocating(false);
        return;
      }
      setError("Couldn't detect your location. Please search for a city.");
      toast.error("Location unavailable");
      setLocating(false);
      return;
    }

    if (navigator.permissions?.query) {
      try {
        const status = await navigator.permissions.query({ name: "geolocation" as PermissionName });
        if (status.state === "denied") {
          setLocating(false);
          // GPS denied — try IP as a last resort before showing instructions.
          if (await useIpFallback(true)) return;
          showPermissionInstructions();
          return;
        }
      } catch {
        // Permissions API not supported here — fall through to getCurrentPosition
      }
    }

    // (locating + error already set above)

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

    const handleError = async (err: GeolocationPositionError) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      if (err.code === err.PERMISSION_DENIED) {
        // Try IP fallback before nagging the user about permissions.
        if (await useIpFallback(true)) {
          setLocating(false);
          return;
        }
        setLocating(false);
        showPermissionInstructions();
        return;
      }
      // For unavailable/timeout errors, attempt IP fallback as a safety net.
      if (await useIpFallback(false)) {
        setLocating(false);
        return;
      }
      const msg =
        err.code === err.POSITION_UNAVAILABLE
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
      { id: "24h" as Tab, label: t("tabs.hourly") },
      { id: "5d" as Tab, label: t("tabs.fiveDays") },
      { id: "10d" as Tab, label: t("tabs.tenDays") },
    ],
    [t]
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
              <Sheet>
                <SheetTrigger asChild>
                  <button
                    aria-label={t("drawer.useCurrent")}
                    className="glass inline-flex h-9 w-9 items-center justify-center rounded-xl text-foreground transition hover:text-primary"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[85vw] max-w-xs overflow-y-auto">
                  <SheetHeader className="text-left">
                    <SheetTitle className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-gradient-sun shadow-glow" />
                      <span className="font-display text-lg font-medium">{t("app.name")}</span>
                    </SheetTitle>
                    <SheetDescription>{t("app.tagline")}</SheetDescription>
                  </SheetHeader>

                  <nav className="mt-6 flex flex-col gap-1">
                    <SheetClose asChild>
                      <button
                        onClick={handleUseCurrent}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition hover:bg-muted/50"
                      >
                        <MapPin className="h-4 w-4 text-primary" />
                        {t("drawer.useCurrent")}
                      </button>
                    </SheetClose>
                    <SheetClose asChild>
                      <button
                        onClick={() => setMapOpen(true)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition hover:bg-muted/50"
                      >
                        <MapIcon className="h-4 w-4 text-primary" />
                        {t("drawer.pickOnMap")}
                      </button>
                    </SheetClose>
                    <SheetClose asChild>
                      <button
                        onClick={handleRefresh}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition hover:bg-muted/50"
                      >
                        <RefreshCw className="h-4 w-4 text-primary" />
                        {t("drawer.refresh")}
                      </button>
                    </SheetClose>
                  </nav>

                  <div className="mt-6">
                    <div className="mb-2 flex items-center gap-2 px-3 text-xs uppercase tracking-wider text-muted-foreground">
                      <Languages className="h-3 w-3" /> {t("drawer.language")}
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {LANGUAGES.map((l) => {
                        const active = i18n.language === l.code || i18n.language?.startsWith(l.code + "-");
                        return (
                          <button
                            key={l.code}
                            onClick={() => i18n.changeLanguage(l.code)}
                            className={`flex flex-col items-start rounded-lg px-3 py-2 text-left text-sm transition hover:bg-muted/50 ${
                              active ? "bg-muted/50 font-medium text-primary" : ""
                            }`}
                          >
                            <span className="truncate">{l.native}</span>
                            <span className="truncate text-xs text-muted-foreground">{l.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="mb-2 flex items-center gap-2 px-3 text-xs uppercase tracking-wider text-muted-foreground">
                      <Globe2 className="h-3 w-3" /> {t("drawer.europe")}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {EUROPEAN_CAPITALS.map((c) => (
                        <SheetClose asChild key={c.id}>
                          <button
                            onClick={() => setLocation(c)}
                            className="flex items-center justify-between gap-3 rounded-lg px-3 py-1.5 text-left text-sm transition hover:bg-muted/50"
                          >
                            <span className="truncate">{c.name}</span>
                            <span className="truncate text-xs text-muted-foreground">{c.country}</span>
                          </button>
                        </SheetClose>
                      ))}
                    </div>

                    <div className="mb-2 mt-4 flex items-center gap-2 px-3 text-xs uppercase tracking-wider text-muted-foreground">
                      <Globe2 className="h-3 w-3" /> {t("drawer.arab")}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {ARABIC_CAPITALS.map((c) => (
                        <SheetClose asChild key={c.id}>
                          <button
                            onClick={() => setLocation(c)}
                            className="flex items-center justify-between gap-3 rounded-lg px-3 py-1.5 text-left text-sm transition hover:bg-muted/50"
                          >
                            <span className="truncate">{c.name}</span>
                            <span className="truncate text-xs text-muted-foreground">{c.country}</span>
                          </button>
                        </SheetClose>
                      ))}
                    </div>
                  </div>

                  {favorites.length > 0 && (
                    <div className="mt-6">
                      <div className="mb-2 flex items-center gap-2 px-3 text-xs uppercase tracking-wider text-muted-foreground">
                        <Star className="h-3 w-3" /> {t("drawer.favorites")}
                      </div>
                      <div className="flex flex-col gap-1">
                        {favorites.map((fav) => (
                          <SheetClose asChild key={fav.id}>
                            <button
                              onClick={() => setLocation(fav)}
                              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-muted/50 ${
                                fav.id === location.id ? "bg-muted/40 font-medium text-primary" : ""
                              }`}
                            >
                              <MapPin className="h-3.5 w-3.5" />
                              <span className="truncate">{fav.name}</span>
                            </button>
                          </SheetClose>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-6 border-t pt-4">
                    <div className="mb-2 flex items-center gap-2 px-3 text-xs uppercase tracking-wider text-muted-foreground">
                      <Info className="h-3 w-3" /> {t("drawer.about")}
                    </div>
                    <a
                      href="https://open-meteo.com"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition hover:bg-muted/50"
                    >
                      <span>{t("drawer.dataSource")}</span>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    </a>
                  </div>
                </SheetContent>
              </Sheet>
              <div className="h-9 w-9 rounded-xl bg-gradient-sun shadow-glow" />
              <span className="font-display text-xl font-medium">{t("app.name")}</span>
            </div>
            <span className="hidden text-xs uppercase tracking-[0.25em] text-muted-foreground sm:block">
              {t("app.worldwide")}
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
              title={online ? t("drawer.refresh") : t("toasts.offlineSaved")}
              className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-foreground transition hover:text-primary disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              <span>{t("actions.refresh")}</span>
            </button>
            {cachedAt && (
              <span className="ml-3 text-xs text-muted-foreground">
                {t("actions.lastUpdated")}: {new Date(cachedAt).toLocaleString()}
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
              <div className="font-medium">{t("offline.title")}</div>
              <div className="text-xs text-muted-foreground">
                {cachedAt
                  ? t("offline.savedAt", { date: new Date(cachedAt).toLocaleString() })
                  : t("offline.connect")}
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
              {tabs.map((tabItem) => (
                <button
                  key={tabItem.id}
                  onClick={() => setTab(tabItem.id)}
                  className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                    tab === tabItem.id
                      ? "bg-gradient-sun text-primary-foreground shadow-glow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tabItem.label}
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
          {t("footer")} <a href="https://open-meteo.com" target="_blank" rel="noreferrer" className="underline hover:text-primary">Open-Meteo</a>
        </footer>
      </div>

      <Dialog open={mapOpen} onOpenChange={setMapOpen}>
        <DialogContent className="max-w-3xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapIcon className="h-5 w-5 text-primary" /> {t("map.title")}
            </DialogTitle>
            <DialogDescription>{t("map.description")}</DialogDescription>
          </DialogHeader>
          <div className="h-[60vh]">
            <WeatherMap
              initial={location}
              onPick={(loc) => {
                setLocation(loc);
                setMapOpen(false);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Index;
