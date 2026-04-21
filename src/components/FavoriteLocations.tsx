import { Star, X } from "lucide-react";
import type { GeoLocation } from "@/lib/weather";

interface Props {
  favorites: GeoLocation[];
  activeId?: number;
  onSelect: (loc: GeoLocation) => void;
  onRemove: (loc: GeoLocation) => void;
}

export const FavoriteLocations = ({ favorites, activeId, onSelect, onRemove }: Props) => {
  if (favorites.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 px-1">
        <Star className="h-3.5 w-3.5 text-primary" strokeWidth={2} fill="currentColor" />
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Favorites</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {favorites.map((f) => {
          const active = f.id === activeId;
          return (
            <div
              key={`${f.id}-${f.latitude}`}
              className={`group glass flex items-center gap-1 rounded-full pl-3 pr-1 py-1 transition ${
                active ? "shadow-glow ring-1 ring-primary/40" : "hover:bg-secondary/40"
              }`}
            >
              <button
                onClick={() => onSelect(f)}
                className="text-sm font-medium text-foreground"
              >
                {f.name}
                {f.country && (
                  <span className="ml-1 text-xs text-muted-foreground">{f.country}</span>
                )}
              </button>
              <button
                onClick={() => onRemove(f)}
                title="Remove favorite"
                className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition hover:bg-destructive/20 hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
