"use client";

import { useEffect, useRef, useState } from "react";
import type { BreakCondition } from "@/app/page";

const RATING_HEX: Record<string, string> = {
  epic: "#a855f7",
  good: "#22c55e",
  fair: "#eab308",
  poor: "#f97316",
  "flat-or-blown": "#ef4444",
  error: "#64748b",
};

const RATING_LABEL: Record<string, string> = {
  epic: "Epic",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
  "flat-or-blown": "Flat / Blown",
};

function markerHtml(color: string, size: number, isSelected: boolean, rating: string) {
  const glow =
    rating === "epic" || rating === "good"
      ? `box-shadow:0 0 ${isSelected ? 18 : 10}px ${color},0 0 4px rgba(0,0,0,0.8);`
      : `box-shadow:0 0 6px rgba(0,0,0,0.6);`;
  const border = isSelected
    ? "border:3px solid white;"
    : "border:2px solid rgba(255,255,255,0.55);";
  const pulse = rating === "epic" && !isSelected ? "animation:surf-pulse 2s infinite;" : "";
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};${border}${glow}${pulse}cursor:pointer;transition:all 0.15s;"></div>`;
}

interface Props {
  breaks: BreakCondition[];
  selected: string | null;
  onSelect: (id: string) => void;
}

export default function BreakMap({ breaks, selected, onSelect }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const markersRef = useRef<{ id: string; marker: any; b: BreakCondition }[]>([]);
  const [mapReady, setMapReady] = useState(false);

  // Init map once
  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current || mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      leafletRef.current = L;
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      const map = L.map(mapRef.current!, {
        center: [36.0, -121.0],
        zoom: 7,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors © <a href="https://carto.com">CARTO</a>',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
      setMapReady(true);

      breaks.forEach((b) => {
        const color = RATING_HEX[b.rating] ?? "#64748b";
        const isSelected = b.break_id === selected;
        const size = isSelected ? 20 : 14;

        const icon = L.divIcon({
          className: "",
          html: markerHtml(color, size, isSelected, b.rating),
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const marker = L.marker([b.lat, b.lng], { icon })
          .addTo(map)
          .bindPopup("", { maxWidth: 240 })
          .on("click", () => onSelect(b.break_id));

        markersRef.current.push({ id: b.break_id, marker, b });
      });

      // Legend
      const legend = new (L.Control as any)({ position: "bottomleft" });
      legend.onAdd = () => {
        const div = L.DomUtil.create("div");
        div.style.cssText =
          "background:rgba(15,23,42,0.92);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:8px 12px;font-family:system-ui;font-size:11px;color:white;line-height:1.8;pointer-events:none;";
        div.innerHTML = (["epic", "good", "fair", "poor", "flat-or-blown"] as const)
          .map(
            (k) =>
              `<div style="display:flex;align-items:center;gap:7px"><div style="width:10px;height:10px;border-radius:50%;background:${RATING_HEX[k]};flex-shrink:0"></div>${RATING_LABEL[k]}</div>`
          )
          .join("");
        return div;
      };
      legend.addTo(map);
    });

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
      markersRef.current = [];
      leafletRef.current = null;
      setMapReady(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker icons and popups when breaks data changes (time window switch or selection)
  useEffect(() => {
    const L = leafletRef.current;
    if (!L || !mapInstanceRef.current) return;
    markersRef.current.forEach(({ id, marker }) => {
      const b = breaks.find((br) => br.break_id === id);
      if (!b) return;
      const isSelected = id === selected;
      const color = RATING_HEX[b.rating] ?? "#64748b";
      const size = isSelected ? 20 : 14;
      marker.setIcon(
        L.divIcon({
          className: "",
          html: markerHtml(color, size, isSelected, b.rating),
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        })
      );
      const waveInfo = b.wave_height_ft
        ? `${b.wave_height_ft}ft${b.period_s ? ` @ ${b.period_s}s` : ""}`
        : "No wave data";
      const popup = `
        <div style="font-family:system-ui,sans-serif;min-width:180px;max-width:220px">
          <div style="font-weight:700;font-size:14px;margin-bottom:3px">${b.break_name}</div>
          <div style="color:${color};font-weight:600;font-size:13px">${RATING_LABEL[b.rating] ?? b.rating} · ${b.score ?? "??"}⁄10</div>
          <div style="color:#94a3b8;font-size:12px;margin-top:6px;line-height:1.7">
            🌊 ${waveInfo}<br/>
            💨 ${(b.wind_quality ?? "").replace(/-/g, " ")}${b.wind_speed_mph ? ` · ${b.wind_speed_mph} mph` : ""}<br/>
            🌊 ${b.tide_stage} tide${b.water_temp_f ? ` · 🌡️ ${b.water_temp_f}°F` : ""}
          </div>
          ${b.briefing ? `<div style="color:#cbd5e1;font-size:11px;margin-top:6px;line-height:1.4">${b.briefing.slice(0, 110)}…</div>` : ""}
        </div>`;
      marker.setPopupContent(popup);
      if (isSelected) marker.openPopup();
    });
  }, [breaks, selected]);

  // Pan to selected break
  useEffect(() => {
    if (!selected || !mapInstanceRef.current || !mapReady) return;
    const brk = breaks.find((b) => b.break_id === selected);
    if (!brk) return;

    mapInstanceRef.current.flyTo([brk.lat, brk.lng], 12, {
      animate: true,
      duration: 0.8,
    });

    const selectedMarker = markersRef.current.find((marker) => marker.id === selected);
    selectedMarker?.marker.openPopup();
  }, [selected, breaks, mapReady]);

  return (
    <>
      <style>{`
        @keyframes surf-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.35); opacity: 0.75; }
        }
        .leaflet-popup-content-wrapper {
          background: #0f172a !important;
          border: 1px solid rgba(255,255,255,0.12) !important;
          color: white !important;
          border-radius: 10px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6) !important;
        }
        .leaflet-popup-tip { background: #0f172a !important; }
        .leaflet-popup-close-button { color: #64748b !important; top: 6px !important; right: 8px !important; }
        .leaflet-control-zoom a { background: rgba(15,23,42,0.92) !important; color: white !important; border-color: rgba(255,255,255,0.1) !important; }
        .leaflet-control-zoom a:hover { background: rgba(30,41,59,0.95) !important; }
        .leaflet-control-attribution { background: rgba(15,23,42,0.7) !important; color: #64748b !important; }
        .leaflet-control-attribution a { color: #94a3b8 !important; }
      `}</style>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} className="w-full h-full" style={{ minHeight: "400px" }} />
    </>
  );
}
