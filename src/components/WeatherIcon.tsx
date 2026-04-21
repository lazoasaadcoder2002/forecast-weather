import {
  Sun, Moon, Cloud, CloudSun, CloudMoon, Cloudy,
  CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WeatherIconName } from "@/lib/weather";

interface Props {
  name: WeatherIconName;
  className?: string;
  glow?: boolean;
}

const map = {
  sun: Sun,
  moon: Moon,
  "cloud-sun": CloudSun,
  "cloud-moon": CloudMoon,
  cloud: Cloud,
  clouds: Cloudy,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
} as const;

const colorMap: Record<WeatherIconName, string> = {
  sun: "text-[hsl(var(--sun))]",
  moon: "text-[hsl(210_40%_92%)]",
  "cloud-sun": "text-[hsl(var(--sun))]",
  "cloud-moon": "text-[hsl(210_40%_88%)]",
  cloud: "text-[hsl(var(--sky))]",
  clouds: "text-[hsl(var(--muted-foreground))]",
  fog: "text-[hsl(var(--muted-foreground))]",
  drizzle: "text-[hsl(var(--sky))]",
  rain: "text-[hsl(var(--sky))]",
  snow: "text-[hsl(199_60%_88%)]",
  storm: "text-[hsl(var(--accent))]",
};

export const WeatherIcon = ({ name, className, glow }: Props) => {
  const Icon = map[name];
  return (
    <Icon
      className={cn(
        colorMap[name],
        glow && "drop-shadow-[0_0_24px_hsl(var(--sun)/0.5)]",
        className
      )}
      strokeWidth={1.5}
    />
  );
};
