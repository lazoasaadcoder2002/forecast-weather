import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, MapPin, Loader2, Locate } from "lucide-react";
import { searchLocations, type GeoLocation } from "@/lib/weather";
import { cn } from "@/lib/utils";

interface Props {
  onSelect: (loc: GeoLocation) => void;
  onUseCurrent: () => void;
  loadingCurrent?: boolean;
}

export const LocationSearch = ({ onSelect, onUseCurrent, loadingCurrent }: Props) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoLocation[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await searchLocations(query);
        setResults(r);
        setOpen(true);
      } finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div ref={wrapRef} className="relative w-full">
      <div className="glass flex items-center gap-3 rounded-full px-5 py-3 transition-all focus-within:shadow-glow">
        <Search className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder={t("search.placeholder")}
          className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/70"
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        <button
          onClick={onUseCurrent}
          title="Use my location"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/60 text-foreground transition hover:bg-secondary hover:text-primary"
        >
          {loadingCurrent ? <Loader2 className="h-4 w-4 animate-spin" /> : <Locate className="h-4 w-4" strokeWidth={1.75} />}
        </button>
      </div>

      {open && results.length > 0 && (
        <div className="glass-strong absolute left-0 right-0 top-full z-30 mt-2 max-h-80 overflow-y-auto rounded-2xl p-2 animate-fade-in-up">
          {results.map((r) => (
            <button
              key={`${r.id}-${r.latitude}`}
              onClick={() => { onSelect(r); setQuery(""); setOpen(false); }}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
                "hover:bg-secondary/70"
              )}
            >
              <MapPin className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.75} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{r.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {[r.admin1, r.country].filter(Boolean).join(", ")}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
