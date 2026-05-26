"use client";

import { useEffect, useRef } from "react";
import type { BreakCondition } from "@/app/page";

const RATING_HEX: Record<string, string> = {
  epic: "#a855f7",
  good: "#22c55e",
  fair: "#eab308",
  poor: "#f97316",
  "flat-or-blown": "#ef4444",
  error: "#64748b",
};

interface Props {
  breaks: BreakCondition[];
  selected: string | null;
  onSelect: (id: string) => void;
}

export default function BreakMap({ breaks, selected, onSelect }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;
    if (mapInstanceRef.current) return; // Already initialized

    // Dynamically import leaflet to avoid SSR issues
    import("leaflet").then((L) => {
      // Fix default icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, {
        center: [33.85, -118.4],
        zoom: 9,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com">CARTO</a>',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Add markers
      breaks.forEach((b) => {
        const color = RATING_HEX[b.rating] ?? "#64748b";
        const size = selected === b.break_id ? 16 : 12;

        const icon = L.divIcon({
          className: "",
          html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 6px rgba(0,0,0,0.5);cursor:pointer;transition:all 0.2s"></div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const marker = L.marker([b.lat, b.lng], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:sans-serif;min-width:160px">
              <strong>${b.break_name}</strong><br/>
              <span style="color:${color}">${b.rating}</span> · ${b.score ?? "??"}/10<br/>
              🌊 ${b.wave_height_ft ?? "?"}ft · 💨 ${b.wind_quality?.replace("-", " ") ?? "?"}<br/>
              <em style="font-size:11px;color:#888">${b.briefing?.slice(0, 80) ?? ""}…</em>
            </div>
          `)
          .on("click", () => onSelect(b.break_id));

        markersRef.current.push({ id: b.break_id, marker });
      });
    });

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
      markersRef.current = [];
    };
  }, []);

  // Pan to selected break
  useEffect(() => {
    if (!selected || !mapInstanceRef.current) return;
    const brk = breaks.find((b) => b.break_id === selected);
    if (brk) {
      mapInstanceRef.current.setView([brk.lat, brk.lng], 12, { animate: true });
    }
  }, [selected, breaks]);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} className="w-full h-full" style={{ minHeight: "400px" }} />
    </>
  );
}
