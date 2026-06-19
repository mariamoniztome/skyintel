import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { useStore, Flight } from "@/src/store/useStore";
import {
  Layers, Map as MapIcon, Satellite, Activity, Navigation,
  ZoomIn, ZoomOut, Maximize2, Filter, Moon, Sun, MapPin, Globe,
} from "lucide-react";
import Filters from "./Filters";

const MAPBOX_TOKEN = (import.meta as any).env.VITE_MAPBOX_ACCESS_TOKEN ||
  "pk.eyJ1IjoibWFyaWFqbW9uaXp0b21lIiwiYSI6ImNtbjM1M2p3bzE0bzgyc3FzMm50OTFiNXYifQ.c2jZXmW-MNuxvJgiuda7fw";

type MapStyle = "streets-v12" | "satellite-v9" | "dark-v11" | "outdoors-v12";

const INITIAL_VIEW_BOUNDS: mapboxgl.LngLatBoundsLike = [[-31.8, 32.0], [-1.8, 42.5]];
const EXPLORE_BOUNDS: mapboxgl.LngLatBoundsLike   = [[-37.0, 27.0], [ 6.0, 47.0]];

// ── Static data ──────────────────────────────────────────────────────────────

const AIRPORTS = [
  { iata: "OPO", name: "Porto",          lon: -8.6814,  lat: 41.2481 },
  { iata: "LIS", name: "Lisbon",         lon: -9.1342,  lat: 38.7742 },
  { iata: "FAO", name: "Faro",           lon: -7.9659,  lat: 37.0144 },
  { iata: "MAD", name: "Madrid",         lon: -3.5609,  lat: 40.4722 },
  { iata: "BCN", name: "Barcelona",      lon:  2.0833,  lat: 41.2974 },
  { iata: "CDG", name: "Paris CDG",      lon:  2.5479,  lat: 49.0097 },
  { iata: "LHR", name: "London",         lon: -0.4543,  lat: 51.4700 },
  { iata: "AMS", name: "Amsterdam",      lon:  4.7683,  lat: 52.3100 },
  { iata: "FRA", name: "Frankfurt",      lon:  8.5622,  lat: 50.0379 },
  { iata: "LUX", name: "Luxembourg",     lon:  6.2044,  lat: 49.6233 },
  { iata: "BRU", name: "Brussels",       lon:  4.4844,  lat: 50.9014 },
  { iata: "VIE", name: "Vienna",         lon: 16.5697,  lat: 48.1103 },
  { iata: "ZRH", name: "Zurich",         lon:  8.5492,  lat: 47.4647 },
  { iata: "DUB", name: "Dublin",         lon: -6.2701,  lat: 53.4213 },
  { iata: "CMN", name: "Casablanca",     lon: -7.5897,  lat: 33.3675 },
  { iata: "PDL", name: "Ponta Delgada",  lon: -25.6979, lat: 37.7412 },
  { iata: "TER", name: "Lajes",          lon: -27.0908, lat: 38.7617 },
  { iata: "HOR", name: "Horta",          lon: -28.7159, lat: 38.5199 },
  { iata: "FNC", name: "Funchal",        lon: -16.7745, lat: 32.6979 },
];

const AIRSPACE_GEOJSON = {
  type: "FeatureCollection" as const,
  features: [
    { type: "Feature" as const, properties: { name: "Lisboa FIR" },
      geometry: { type: "Polygon" as const, coordinates: [[[-9.5,42.2],[-6.0,42.2],[-6.0,36.9],[-9.5,36.9],[-9.5,42.2]]] } },
    { type: "Feature" as const, properties: { name: "Santa Maria OAC" },
      geometry: { type: "Polygon" as const, coordinates: [[[-40.0,27.0],[-10.0,27.0],[-10.0,45.0],[-40.0,45.0],[-40.0,27.0]]] } },
    { type: "Feature" as const, properties: { name: "Madrid FIR" },
      geometry: { type: "Polygon" as const, coordinates: [[[-9.3,35.9],[3.3,35.9],[3.3,43.8],[-9.3,43.8],[-9.3,35.9]]] } },
    { type: "Feature" as const, properties: { name: "Bordeaux FIR" },
      geometry: { type: "Polygon" as const, coordinates: [[[-9.5,43.5],[2.0,43.5],[2.0,48.0],[-9.5,48.0],[-9.5,43.5]]] } },
    { type: "Feature" as const, properties: { name: "Brest Océanique FIR" },
      geometry: { type: "Polygon" as const, coordinates: [[[-15.0,45.0],[2.0,45.0],[2.0,51.5],[-15.0,51.5],[-15.0,45.0]]] } },
  ],
};

// ── Component ────────────────────────────────────────────────────────────────

const FlightMap: React.FC = () => {
  const mapContainer   = useRef<HTMLDivElement>(null);
  const controlsContainer = useRef<HTMLDivElement>(null);
  const map            = useRef<mapboxgl.Map | null>(null);
  const markers        = useRef<Record<string, mapboxgl.Marker>>({});

  const { flights, setSelectedFlightId, riskFilter, searchQuery, theme, selectedFlight, setTheme } = useStore();

  const [currentStyle, setCurrentStyle] = useState<MapStyle>("streets-v12");
  const [showTraffic,  setShowTraffic]  = useState(false);
  const [showAirports, setShowAirports] = useState(true);
  const [showAirspace, setShowAirspace] = useState(false);
  const [isMenuOpen,   setIsMenuOpen]   = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Refs for values accessed inside stable Mapbox GL callbacks (avoid stale closures)
  const showTrafficRef  = useRef(false);
  const showAirportsRef = useRef(true);
  const showAirspaceRef = useRef(false);
  const selectedFlightRef = useRef<Flight | null>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const getSafeHeading = (h: number) => {
    if (!Number.isFinite(h)) return 0;
    const n = h % 360;
    return n < 0 ? n + 360 : n;
  };

  const riskColor = (risk: string) =>
    risk === "high" ? "#f43f5e" : risk === "medium" ? "#fbbf24" : "#10b981";

  // ── HTML Flight Markers ───────────────────────────────────────────────────

  const clearAllMarkers = () => {
    Object.values(markers.current).forEach(m => m.remove());
    markers.current = {};
  };

  const updateMarkerVisual = (el: HTMLDivElement, color: string, heading: number) => {
    el.style.backgroundColor = color;
    el.style.boxShadow = `0 0 10px ${color}`;
    const icon = el.querySelector(".plane-icon") as HTMLDivElement | null;
    if (icon) icon.style.transform = `rotate(${getSafeHeading(heading)}deg)`;
  };

  // ── Airport / Airspace GeoJSON layers ─────────────────────────────────────

  const initAirportLayers = () => {
    if (!map.current) return;
    if (!map.current.getSource("airports")) {
      map.current.addSource("airports", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: AIRPORTS.map(a => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [a.lon, a.lat] },
            properties: { iata: a.iata, name: a.name },
          })),
        } as any,
      });
    }
    const vis = (showAirportsRef.current ? "visible" : "none") as "visible" | "none";
    if (!map.current.getLayer("airport-circles")) {
      map.current.addLayer({
        id: "airport-circles", type: "circle", source: "airports",
        layout: { visibility: vis },
        paint: { "circle-radius": 5, "circle-color": "#ffffff", "circle-stroke-color": "#475569", "circle-stroke-width": 1.5 },
      });
    }
    if (!map.current.getLayer("airport-labels")) {
      map.current.addLayer({
        id: "airport-labels", type: "symbol", source: "airports",
        layout: {
          visibility: vis,
          "text-field": ["get", "iata"],
          "text-size": 10,
          "text-offset": [0, 1.5],
          "text-anchor": "top",
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
        },
        paint: { "text-color": "#1e293b", "text-halo-color": "#ffffff", "text-halo-width": 1.5 },
      });
    }
  };

  const initAirspaceLayers = () => {
    if (!map.current) return;
    if (!map.current.getSource("airspace")) {
      map.current.addSource("airspace", { type: "geojson", data: AIRSPACE_GEOJSON as any });
    }
    const vis = (showAirspaceRef.current ? "visible" : "none") as "visible" | "none";
    if (!map.current.getLayer("airspace-fill")) {
      map.current.addLayer({
        id: "airspace-fill", type: "fill", source: "airspace",
        layout: { visibility: vis },
        paint: { "fill-color": "#3b82f6", "fill-opacity": 0.05 },
      });
    }
    if (!map.current.getLayer("airspace-border")) {
      map.current.addLayer({
        id: "airspace-border", type: "line", source: "airspace",
        layout: { visibility: vis },
        paint: { "line-color": "#3b82f6", "line-width": 1.5, "line-dasharray": [4, 3], "line-opacity": 0.7 },
      });
    }
    if (!map.current.getLayer("airspace-labels")) {
      map.current.addLayer({
        id: "airspace-labels", type: "symbol", source: "airspace",
        layout: {
          visibility: vis,
          "text-field": ["get", "name"],
          "text-size": 11,
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
        },
        paint: { "text-color": "#3b82f6", "text-halo-color": "#ffffff", "text-halo-width": 1, "text-opacity": 0.8 },
      });
    }
  };

  const initAllLayers = () => {
    initAirspaceLayers();
    initAirportLayers();
  };

  // ── Traffic ────────────────────────────────────────────────────────────────

  const addTrafficLayer = () => {
    if (!map.current || map.current.getSource("mapbox-traffic")) return;
    map.current.addSource("mapbox-traffic", { type: "vector", url: "mapbox://mapbox.mapbox-traffic-v1" });
    map.current.addLayer({
      id: "traffic-layer", type: "line",
      source: "mapbox-traffic", "source-layer": "traffic",
      paint: {
        "line-width": 2, "line-opacity": 0.85,
        "line-color": [
          "match", ["get", "congestion"],
          "low",      "#10b981",
          "moderate", "#fbbf24",
          "heavy",    "#f97316",
          "severe",   "#f43f5e",
          "#94a3b8",
        ],
      },
    });
  };

  const removeTrafficLayer = () => {
    if (!map.current) return;
    if (map.current.getLayer("traffic-layer")) map.current.removeLayer("traffic-layer");
    if (map.current.getSource("mapbox-traffic")) map.current.removeSource("mapbox-traffic");
  };

  // ── Flight path ────────────────────────────────────────────────────────────

  const drawFlightPath = (flight: Flight) => {
    if (!map.current?.isStyleLoaded() || !flight.history || flight.history.length < 2) {
      removeFlightPath(); return;
    }
    const coords = [...flight.history]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(h => [h.lon, h.lat]);
    coords.push([flight.lon, flight.lat]);
    const geojson: any = { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } };

    if (map.current.getSource("selected-flight-path")) {
      (map.current.getSource("selected-flight-path") as mapboxgl.GeoJSONSource).setData(geojson);
    } else {
      map.current.addSource("selected-flight-path", { type: "geojson", data: geojson });
      map.current.addLayer({
        id: "selected-flight-path-glow", type: "line", source: "selected-flight-path",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#3b82f6", "line-width": 6, "line-opacity": 0.3, "line-blur": 4 },
      });
      map.current.addLayer({
        id: "selected-flight-path-line", type: "line", source: "selected-flight-path",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#60a5fa", "line-width": 2, "line-dasharray": [2, 1] },
      });
    }
  };

  const removeFlightPath = () => {
    if (!map.current) return;
    if (map.current.getLayer("selected-flight-path-line")) map.current.removeLayer("selected-flight-path-line");
    if (map.current.getLayer("selected-flight-path-glow")) map.current.removeLayer("selected-flight-path-glow");
    if (map.current.getSource("selected-flight-path")) map.current.removeSource("selected-flight-path");
  };

  // ── Map init ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (map.current || !mapContainer.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: `mapbox://styles/mapbox/${currentStyle}`,
      bounds: INITIAL_VIEW_BOUNDS,
      fitBoundsOptions: { padding: 24, maxZoom: 5.1 },
      maxBounds: EXPLORE_BOUNDS,
      projection: "mercator" as any,
      pitchWithRotate: false,
      dragRotate: false,
      touchPitch: false,
      trackResize: true,
    });

    const resizeObserver = new ResizeObserver(() => map.current?.resize());
    resizeObserver.observe(mapContainer.current);

    map.current.once("style.load", initAllLayers);

    return () => {
      resizeObserver.disconnect();
      clearAllMarkers();
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // ── Style change — re-add GL layers (HTML markers persist automatically) ──

  useEffect(() => {
    if (!map.current) return;
    map.current.once("style.load", () => {
      initAllLayers();
      if (showTrafficRef.current) addTrafficLayer();
      const sf = selectedFlightRef.current;
      if (sf?.history && sf.history.length > 1) drawFlightPath(sf);
    });
    map.current.setStyle(`mapbox://styles/mapbox/${currentStyle}`);
  }, [currentStyle]);

  // ── Overlay toggles ────────────────────────────────────────────────────────

  useEffect(() => {
    showTrafficRef.current = showTraffic;
    if (!map.current) return;
    showTraffic ? addTrafficLayer() : removeTrafficLayer();
  }, [showTraffic]);

  useEffect(() => {
    showAirportsRef.current = showAirports;
    const vis = showAirports ? "visible" : "none";
    if (!map.current) return;
    if (map.current.getLayer("airport-circles")) map.current.setLayoutProperty("airport-circles", "visibility", vis);
    if (map.current.getLayer("airport-labels"))  map.current.setLayoutProperty("airport-labels",  "visibility", vis);
  }, [showAirports]);

  useEffect(() => {
    showAirspaceRef.current = showAirspace;
    const vis = showAirspace ? "visible" : "none";
    if (!map.current) return;
    if (map.current.getLayer("airspace-fill"))   map.current.setLayoutProperty("airspace-fill",   "visibility", vis);
    if (map.current.getLayer("airspace-border")) map.current.setLayoutProperty("airspace-border", "visibility", vis);
    if (map.current.getLayer("airspace-labels")) map.current.setLayoutProperty("airspace-labels", "visibility", vis);
  }, [showAirspace]);

  // ── Theme ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!map.current) return;
    setCurrentStyle(theme === "dark" ? "dark-v11" : "streets-v12");
  }, [theme]);

  // ── Selected flight ────────────────────────────────────────────────────────

  useEffect(() => {
    selectedFlightRef.current = selectedFlight;
    if (!map.current) return;
    if (!selectedFlight) { removeFlightPath(); return; }

    map.current.flyTo({ center: [selectedFlight.lon, selectedFlight.lat], zoom: 7, duration: 1500, essential: true });

    if (map.current.isStyleLoaded()) {
      drawFlightPath(selectedFlight);
    } else {
      map.current.once("style.load", () => drawFlightPath(selectedFlight));
    }
  }, [selectedFlight]);

  // ── Flight markers ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!map.current) return;

    const filtered = flights.filter(f => {
      const s = searchQuery.toLowerCase();
      return (f.callsign.toLowerCase().includes(s) || f.id.toLowerCase().includes(s))
        && (riskFilter === "all" || f.riskLevel === riskFilter);
    });

    // Remove markers for flights no longer in filtered list
    Object.keys(markers.current).forEach(id => {
      if (!filtered.find(f => f.id === id)) {
        markers.current[id].remove();
        delete markers.current[id];
      }
    });

    filtered.forEach(flight => {
      const color = riskColor(flight.riskLevel || "low");

      if (markers.current[flight.id]) {
        markers.current[flight.id].setLngLat([flight.lon, flight.lat]);
        updateMarkerVisual(markers.current[flight.id].getElement() as HTMLDivElement, color, flight.heading);
        return;
      }

      const el = document.createElement("div");
      el.className = "marker";
      el.style.cssText = `width:24px;height:24px;border-radius:50%;background-color:${color};border:2px solid white;cursor:pointer;box-shadow:0 0 10px ${color};display:flex;align-items:center;justify-content:center;`;
      el.innerHTML = `<div class="plane-icon" style="color:white;font-size:11px;transform:rotate(${getSafeHeading(flight.heading)}deg);transform-origin:center;line-height:1">✈</div>`;

      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false, closeOnClick: false, className: "flight-tooltip" })
        .setHTML(
          `<div style="padding:8px;font-family:sans-serif">` +
          `<div style="font-weight:900;font-size:14px">${flight.callsign || flight.id}</div>` +
          `<div style="font-size:10px;color:#666">Alt: ${Math.round(flight.altitude).toLocaleString()} ft</div>` +
          `<div style="font-size:10px;color:#666">Spd: ${Math.round(flight.speed)} kts</div>` +
          `</div>`
        );

      const marker = new mapboxgl.Marker(el)
        .setLngLat([flight.lon, flight.lat])
        .setPopup(popup)
        .addTo(map.current!);

      el.addEventListener("mouseenter", () => popup.addTo(map.current!));
      el.addEventListener("mouseleave", () => popup.remove());
      el.addEventListener("click",      () => setSelectedFlightId(flight.id));

      markers.current[flight.id] = marker;
    });
  }, [flights, riskFilter, searchQuery, setSelectedFlightId]);

  // ── Menu close on outside click ────────────────────────────────────────────

  useEffect(() => {
    if (!isMenuOpen && !isFiltersOpen) return;
    const handler = (e: MouseEvent) => {
      if (controlsContainer.current && !controlsContainer.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
        setIsFiltersOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isMenuOpen, isFiltersOpen]);

  // ── Controls ───────────────────────────────────────────────────────────────

  const handleZoomIn  = () => map.current?.easeTo({ zoom: (map.current.getZoom() ?? 5) + 0.8, duration: 250 });
  const handleZoomOut = () => map.current?.easeTo({ zoom: (map.current.getZoom() ?? 5) - 0.8, duration: 250 });
  const handleFullscreen = () => {
    if (!map.current) return;
    document.fullscreenElement ? void document.exitFullscreen() : void map.current.getContainer().requestFullscreen?.();
  };
  const handleUserLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(({ coords }) =>
      map.current?.flyTo({ center: [coords.longitude, coords.latitude], zoom: 9, essential: true })
    );
  };

  const Toggle = ({ on }: { on: boolean }) => (
    <div className={`w-8 h-4 rounded-full relative transition-colors ${on ? "bg-sky-500" : "bg-gray-400"}`}>
      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${on ? "right-0.5" : "left-0.5"}`} />
    </div>
  );

  // ── JSX ────────────────────────────────────────────────────────────────────

  return (
    <div className="relative w-full h-full min-h-100 overflow-hidden border border-(--border) shadow-2xl">
      <div ref={mapContainer} className="w-full h-full absolute inset-0" />

      <div ref={controlsContainer} className="absolute bottom-8 right-4 z-20 flex items-center gap-2">
        {isFiltersOpen && (
          <div className="absolute bottom-full right-0 mb-2">
            <Filters compact className="w-75" />
          </div>
        )}

        {isMenuOpen && (
          <div className="absolute bottom-full right-0 mb-2 w-60 bg-(--card) border border-(--border) rounded-xl shadow-2xl p-2 space-y-1 animate-in fade-in slide-in-from-bottom-2">

            <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-(--muted-foreground) font-bold">Base Style</div>
            {(
              [
                { id: "streets-v12",  label: "Streets",   Icon: Navigation },
                { id: "outdoors-v12", label: "Outdoors",  Icon: MapIcon    },
                { id: "satellite-v9", label: "Satellite", Icon: Satellite  },
              ] as { id: MapStyle; label: string; Icon: React.ElementType }[]
            ).map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => { setCurrentStyle(id); setIsMenuOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${currentStyle === id ? "bg-(--muted) text-sky-500" : "hover:bg-(--muted)"}`}
              >
                <Icon className="h-4 w-4" /><span>{label}</span>
              </button>
            ))}

            <div className="h-px bg-(--border) my-1" />
            <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-(--muted-foreground) font-bold">Overlays</div>

            {(
              [
                { label: "Traffic Density",     Icon: Activity, on: showTraffic,  toggle: () => setShowTraffic(v  => !v) },
                { label: "Airport Markers",     Icon: MapPin,   on: showAirports, toggle: () => setShowAirports(v => !v) },
                { label: "Airspace Boundaries", Icon: Globe,    on: showAirspace, toggle: () => setShowAirspace(v => !v) },
              ] as { label: string; Icon: React.ElementType; on: boolean; toggle: () => void }[]
            ).map(({ label, Icon, on, toggle }) => (
              <button key={label} onClick={toggle}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${on ? "bg-(--muted) text-sky-500" : "hover:bg-(--muted)"}`}
              >
                <div className="flex items-center gap-2"><Icon className="h-4 w-4" /><span>{label}</span></div>
                <Toggle on={on} />
              </button>
            ))}
          </div>
        )}

        <div className="rounded-full px-2 py-1 flex items-center gap-1 bg-(--card)/88 backdrop-blur-md border border-(--border) shadow-lg">
          <button onClick={handleZoomIn}       title="Zoom in"               className="p-2 rounded-full hover:bg-(--muted) transition-colors"><ZoomIn    className="h-4 w-4" /></button>
          <button onClick={handleZoomOut}      title="Zoom out"              className="p-2 rounded-full hover:bg-(--muted) transition-colors"><ZoomOut   className="h-4 w-4" /></button>
          <button onClick={handleFullscreen}   title="Fullscreen"            className="p-2 rounded-full hover:bg-(--muted) transition-colors"><Maximize2 className="h-4 w-4" /></button>
          <div className="w-px h-5 bg-(--border) mx-0.5" />
          <button onClick={handleUserLocation} title="Center on my location" className="p-2 rounded-full hover:bg-(--muted) transition-colors"><Navigation className="h-4 w-4 -rotate-90" /></button>
          <button onClick={() => { setIsFiltersOpen(v => !v); setIsMenuOpen(false); }} title="Filters"
            className={`p-2 rounded-full transition-colors ${isFiltersOpen ? "bg-(--muted)" : "hover:bg-(--muted)"}`}>
            <Filter className="h-4 w-4" />
          </button>
          <button onClick={() => { setIsMenuOpen(v => !v); setIsFiltersOpen(false); }} title="Map layers"
            className={`p-2 rounded-full transition-colors ${isMenuOpen ? "bg-(--muted)" : "hover:bg-(--muted)"}`}>
            <Layers className="h-4 w-4" />
          </button>
          <button
            onClick={() => { const n = theme === "light" ? "dark" : "light"; setTheme(n); setCurrentStyle(n === "dark" ? "dark-v11" : "streets-v12"); }}
            title={theme === "light" ? "Dark mode" : "Light mode"}
            className="p-2 rounded-full hover:bg-(--muted) transition-colors"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="absolute bottom-9 left-1 bg-(--card)/80 backdrop-blur-md p-3 rounded-lg border border-(--border) text-xs space-y-2 shadow-sm z-10">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span>Low Turbulence</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"   /><span>Medium Turbulence</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500"    /><span>High Turbulence</span></div>
      </div>
    </div>
  );
};

export default FlightMap;
