import { useCallback, useEffect, useState } from "react";
import type { GeoLocation } from "@/lib/weather";

const STORAGE_KEY = "skyline:favorites";

const keyOf = (l: GeoLocation) => `${l.latitude.toFixed(3)},${l.longitude.toFixed(3)}`;

const read = (): GeoLocation[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<GeoLocation[]>([]);

  useEffect(() => {
    setFavorites(read());
  }, []);

  const persist = useCallback((next: GeoLocation[]) => {
    setFavorites(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota errors */
    }
  }, []);

  const isFavorite = useCallback(
    (loc: GeoLocation) => favorites.some((f) => keyOf(f) === keyOf(loc)),
    [favorites]
  );

  const toggleFavorite = useCallback(
    (loc: GeoLocation) => {
      const k = keyOf(loc);
      const exists = favorites.some((f) => keyOf(f) === k);
      persist(exists ? favorites.filter((f) => keyOf(f) !== k) : [...favorites, loc]);
    },
    [favorites, persist]
  );

  const removeFavorite = useCallback(
    (loc: GeoLocation) => persist(favorites.filter((f) => keyOf(f) !== keyOf(loc))),
    [favorites, persist]
  );

  return { favorites, isFavorite, toggleFavorite, removeFavorite };
};
