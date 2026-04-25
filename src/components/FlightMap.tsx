import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { useStore, Flight } from "@/src/store/useStore";
import { Layers, Map as MapIcon, Satellite, Activity, Navigation, CloudRain, ZoomIn, ZoomOut, Maximize2, Filter, Moon, Sun } from "lucide-react";
import Filters from "./Filters";

// Replace with your actual token or use env
const MAPBOX_TOKEN = (import.meta as any).env.VITE_MAPBOX_ACCESS_TOKEN || "pk.eyJ1IjoibWFyaWFqbW9uaXp0b21lIiwiYSI6ImNtbjM1M2p3bzE0bzgyc3FzMm50OTFiNXYifQ.c2jZXmW-MNuxvJgiuda7fw";

type MapStyle = "streets-v12" | "satellite-v9" | "dark-v11" | "light-v11";

const INITIAL_VIEW_BOUNDS: mapboxgl.LngLatBoundsLike = [
  [-31.8, 32.0],
  [-1.8, 42.5],
];

const EXPLORE_BOUNDS: mapboxgl.LngLatBoundsLike = [
  [-37.0, 27.0],
  [6.0, 47.0],
];

const FlightMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const controlsContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const { flights, setSelectedFlightId, riskFilter, searchQuery, theme, selectedFlight, setTheme } = useStore();
  
  const [currentStyle, setCurrentStyle] = useState<MapStyle>("streets-v12");
  const [showTraffic, setShowTraffic] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [weatherTimestamp, setWeatherTimestamp] = useState<number | null>(null);

  const clearAllMarkers = () => {
    Object.values(markers.current).forEach((marker: mapboxgl.Marker) => marker.remove());
    markers.current = {};
  };

  useEffect(() => {
    // Fetch latest weather timestamp from RainViewer - refresh every 5 minutes
    const fetchWeatherData = () => {
      fetch("https://api.rainviewer.com/public/weather-maps.json")
        .then(res => {
          if (!res.ok) throw new Error(`RainViewer API error: ${res.status}`);
          return res.json();
        })
        .then(data => {
          // Get the most recent past radar data
          if (data.radar?.past?.length > 0) {
            const latestTimestamp = data.radar.past[data.radar.past.length - 1].time;
            console.log("Latest weather timestamp:", latestTimestamp);
            setWeatherTimestamp(latestTimestamp);
          } else if (data.radar?.nowcast?.length > 0) {
            // Fallback to nowcast if no past data available
            const latestTimestamp = data.radar.nowcast[0].time;
            console.log("Using nowcast timestamp:", latestTimestamp);
            setWeatherTimestamp(latestTimestamp);
          } else {
            console.warn("No radar data available from RainViewer");
          }
        })
        .catch(err => console.warn("Failed to fetch weather data from RainViewer:", err));
    };

    fetchWeatherData();
    // Refresh weather data every 5 minutes
    const weatherInterval = setInterval(fetchWeatherData, 5 * 60 * 1000);
    
    return () => clearInterval(weatherInterval);
  }, []);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    // Ensure no stale markers survive across map remounts.
    clearAllMarkers();

    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: `mapbox://styles/mapbox/${currentStyle}`,
      bounds: INITIAL_VIEW_BOUNDS,
      fitBoundsOptions: { padding: 24, maxZoom: 5.1 },
      maxBounds: EXPLORE_BOUNDS,
      trackResize: true,
    });

    // Handle container resize
    const resizeObserver = new ResizeObserver(() => {
      map.current?.resize();
    });
    resizeObserver.observe(mapContainer.current);

    map.current.on('style.load', () => {
      if (showTraffic) {
        addTrafficLayer();
      }
      if (showWeather) {
        addWeatherLayer();
      }
      if (selectedFlight?.history) {
        drawFlightPath(selectedFlight);
      }
    });

    return () => {
      resizeObserver.disconnect();
      clearAllMarkers();
      map.current?.remove();
      map.current = null;
    };
  }, []);

  const addTrafficLayer = () => {
    if (!map.current) return;
    if (!map.current.getSource('mapbox-traffic')) {
      map.current.addSource('mapbox-traffic', {
        type: 'vector',
        url: 'mapbox://mapbox.mapbox-traffic-v1'
      });
      map.current.addLayer({
        'id': 'traffic-layer',
        'type': 'line',
        'source': 'mapbox-traffic',
        'source-layer': 'traffic',
        'paint': {
          'line-width': 1.5,
          'line-color': [
            'interpolate',
            ['linear'],
            ['get', 'congestion'],
            0, 'rgba(0, 255, 0, 0.5)',
            50, 'rgba(255, 255, 0, 0.5)',
            100, 'rgba(255, 0, 0, 0.5)'
          ]
        }
      });
    }
  };

  const removeTrafficLayer = () => {
    if (!map.current) return;
    if (map.current.getLayer('traffic-layer')) {
      map.current.removeLayer('traffic-layer');
    }
    if (map.current.getSource('mapbox-traffic')) {
      map.current.removeSource('mapbox-traffic');
    }
  };

  const addWeatherLayer = () => {
    if (!map.current) return;
    
    if (!weatherTimestamp) {
      console.warn("Weather timestamp not available yet");
      return;
    }

    if (!map.current.getSource('rainviewer-radar')) {
      try {
        map.current.addSource('rainviewer-radar', {
          type: 'raster',
          tiles: [
            `https://tilecache.rainviewer.com/v2/radar/${weatherTimestamp}/256/{z}/{x}/{y}/2/1_1.png`
          ],
          tileSize: 256,
          attribution: '© RainViewer'
        });
        
        map.current.addLayer({
          id: 'radar-layer',
          type: 'raster',
          source: 'rainviewer-radar',
          minzoom: 0,
          maxzoom: 22,
          paint: {
            'raster-opacity': 0.6,
            'raster-fade-duration': 300
          }
        }, 'water');
        
        console.log("Weather layer added successfully");
      } catch (error) {
        console.error("Failed to add weather layer:", error);
      }
    }
  };

  const removeWeatherLayer = () => {
    if (!map.current) return;
    if (map.current.getLayer('radar-layer')) {
      map.current.removeLayer('radar-layer');
    }
    if (map.current.getSource('rainviewer-radar')) {
      map.current.removeSource('rainviewer-radar');
    }
  };

  const drawFlightPath = (flight: Flight) => {
    if (!map.current || !flight.history || flight.history.length < 2) {
      removeFlightPath();
      return;
    }

    const coordinates = [...flight.history]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(h => [h.lon, h.lat]);

    // Add current position as the last point
    coordinates.push([flight.lon, flight.lat]);

    const geojson: any = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: coordinates
      }
    };

    if (map.current.getSource('selected-flight-path')) {
      (map.current.getSource('selected-flight-path') as mapboxgl.GeoJSONSource).setData(geojson);
    } else {
      map.current.addSource('selected-flight-path', {
        type: 'geojson',
        data: geojson
      });

      map.current.addLayer({
        id: 'selected-flight-path-glow',
        type: 'line',
        source: 'selected-flight-path',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 6,
          'line-opacity': 0.3,
          'line-blur': 4
        }
      });

      map.current.addLayer({
        id: 'selected-flight-path-line',
        type: 'line',
        source: 'selected-flight-path',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#60a5fa',
          'line-width': 2,
          'line-dasharray': [2, 1]
        }
      });
    }
  };

  const removeFlightPath = () => {
    if (!map.current) return;
    if (map.current.getLayer('selected-flight-path-line')) map.current.removeLayer('selected-flight-path-line');
    if (map.current.getLayer('selected-flight-path-glow')) map.current.removeLayer('selected-flight-path-glow');
    if (map.current.getSource('selected-flight-path')) map.current.removeSource('selected-flight-path');
  };

  useEffect(() => {
    if (!map.current) return;
    map.current.setStyle(`mapbox://styles/mapbox/${currentStyle}`);
  }, [currentStyle]);

  useEffect(() => {
    if (!map.current) return;
    if (showTraffic) {
      addTrafficLayer();
    } else {
      removeTrafficLayer();
    }
  }, [showTraffic]);

  useEffect(() => {
    if (!map.current) return;
    if (showWeather) {
      addWeatherLayer();
    } else {
      removeWeatherLayer();
    }
  }, [showWeather, weatherTimestamp]);

  useEffect(() => {
    if (!map.current) return;
    // Sync style with theme if user hasn't manually changed it to satellite/streets
    if (currentStyle === "dark-v11" || currentStyle === "light-v11") {
      setCurrentStyle(theme === "dark" ? "dark-v11" : "light-v11");
    }
  }, [theme]);

  useEffect(() => {
    if (!map.current) return;
    if (selectedFlight) {
      drawFlightPath(selectedFlight);
    } else {
      removeFlightPath();
    }
  }, [selectedFlight]);

  useEffect(() => {
    if (!isMenuOpen && !isFiltersOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (controlsContainer.current && !controlsContainer.current.contains(target)) {
        setIsMenuOpen(false);
        setIsFiltersOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen, isFiltersOpen]);

  const handleZoomIn = () => {
    if (!map.current) return;
    map.current.easeTo({ zoom: map.current.getZoom() + 0.8, duration: 250 });
  };

  const handleZoomOut = () => {
    if (!map.current) return;
    map.current.easeTo({ zoom: map.current.getZoom() - 0.8, duration: 250 });
  };

  const handleFullscreen = () => {
    if (!map.current) return;
    const container = map.current.getContainer();
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    void container.requestFullscreen?.();
  };

  const handleUserLocation = () => {
    if (!map.current || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      map.current?.flyTo({ center: [longitude, latitude], zoom: 9, essential: true });
    });
  };

  useEffect(() => {
    if (!map.current) return;

    // Filter flights
    const filteredFlights = flights.filter(f => {
      const matchesSearch = f.callsign.toLowerCase().includes(searchQuery.toLowerCase()) || f.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRisk = riskFilter === "all" || f.riskLevel === riskFilter;
      return matchesSearch && matchesRisk;
    });

    // Remove old markers
    Object.keys(markers.current).forEach(id => {
      if (!filteredFlights.find(f => f.id === id)) {
        markers.current[id].remove();
        delete markers.current[id];
      }
    });

    // Add/Update markers
    filteredFlights.forEach(flight => {
      const color = flight.riskLevel === "high" ? "#f43f5e" : flight.riskLevel === "medium" ? "#fbbf24" : "#10b981";
      
      if (markers.current[flight.id]) {
        markers.current[flight.id].setLngLat([flight.lon, flight.lat]);
      } else {
        const el = document.createElement("div");
        el.className = "marker";
        el.style.width = "24px";
        el.style.height = "24px";
        el.style.borderRadius = "50%";
        el.style.backgroundColor = color;
        el.style.border = "2px solid white";
        el.style.cursor = "pointer";
        el.style.boxShadow = `0 0 10px ${color}`;
        
        // Add plane icon or simple dot
        el.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: white; font-size: 10px; font-weight: bold;">✈</div>`;

        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: false,
          closeOnClick: false,
          className: 'flight-tooltip'
        }).setHTML(`
          <div style="padding: 8px; font-family: sans-serif;">
            <div style="font-weight: 900; font-size: 14px; margin-bottom: 4px;">${flight.callsign || flight.id}</div>
            <div style="font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Alt: ${Math.round(flight.altitude).toLocaleString()} ft</div>
            <div style="font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Spd: ${Math.round(flight.speed)} kts</div>
          </div>
        `);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([flight.lon, flight.lat])
          .setPopup(popup)
          .addTo(map.current!);

        el.addEventListener("mouseenter", () => popup.addTo(map.current!));
        el.addEventListener("mouseleave", () => popup.remove());

        el.addEventListener("click", () => {
          setSelectedFlightId(flight.id);
        });

        markers.current[flight.id] = marker;
      }
    });
  }, [flights, riskFilter, searchQuery, setSelectedFlightId]);

  return (
    <div className="relative w-full h-full min-h-100 overflow-hidden border border-(--border) shadow-2xl">
      <div ref={mapContainer} className="w-full h-full absolute inset-0" />
      
      {/* Unified Controls */}
      <div ref={controlsContainer} className="absolute bottom-8 right-4 z-20 flex items-center gap-2">
        {isFiltersOpen && (
          <div className="absolute bottom-full right-0 mb-2">
            <Filters compact className="w-75" />
          </div>
        )}

        {isMenuOpen && (
          <div className="absolute bottom-full right-0 mb-2 w-56 bg-(--card) border border-(--border) rounded-xl shadow-2xl p-2 space-y-1 animate-in fade-in slide-in-from-bottom-2">
            <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-(--muted-foreground) font-bold">Base Style</div>
            <button
              onClick={() => { setCurrentStyle(theme === "dark" ? "dark-v11" : "light-v11"); setIsMenuOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${currentStyle.includes("light") || currentStyle.includes("dark") ? "bg-(--muted) text-(--accent)" : "hover:bg-(--muted)"}`}
            >
              <MapIcon className="h-4 w-4" />
              <span>Default {theme === "dark" ? "Dark" : "Light"}</span>
            </button>
            <button
              onClick={() => { setCurrentStyle("streets-v12"); setIsMenuOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${currentStyle === "streets-v12" ? "bg-(--muted) text-(--accent)" : "hover:bg-(--muted)"}`}
            >
              <Navigation className="h-4 w-4" />
              <span>Streets</span>
            </button>
            <button
              onClick={() => { setCurrentStyle("satellite-v9"); setIsMenuOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${currentStyle === "satellite-v9" ? "bg-(--muted) text-(--accent)" : "hover:bg-(--muted)"}`}
            >
              <Satellite className="h-4 w-4" />
              <span>Satellite</span>
            </button>

            <div className="h-px bg-(--border) my-1" />
            <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-(--muted-foreground) font-bold">Overlays</div>
            <button
              onClick={() => setShowTraffic(!showTraffic)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${showTraffic ? "bg-(--muted) text-(--accent)" : "hover:bg-(--muted)"}`}
            >
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span>Traffic Density</span>
              </div>
              <div className={`w-8 h-4 rounded-full relative transition-colors ${showTraffic ? "bg-sky-500" : "bg-gray-400"}`}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${showTraffic ? "right-0.5" : "left-0.5"}`} />
              </div>
            </button>

            <button
              onClick={() => setShowWeather(!showWeather)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${showWeather ? "bg-(--muted) text-(--accent)" : "hover:bg-(--muted)"}`}
            >
              <div className="flex items-center gap-2">
                <CloudRain className="h-4 w-4" />
                <span>Weather Radar</span>
              </div>
              <div className={`w-8 h-4 rounded-full relative transition-colors ${showWeather ? "bg-sky-500" : "bg-gray-400"}`}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${showWeather ? "right-0.5" : "left-0.5"}`} />
              </div>
            </button>
          </div>
        )}

        <div className="rounded-full px-2 py-1 flex items-center gap-1 bg-(--card)/88 backdrop-blur-md border border-(--border) shadow-lg">
          <button onClick={handleZoomIn} title="Zoom in" className="p-2 rounded-full hover:bg-(--muted) transition-colors">
            <ZoomIn className="h-4 w-4" />
          </button>
          <button onClick={handleZoomOut} title="Zoom out" className="p-2 rounded-full hover:bg-(--muted) transition-colors">
            <ZoomOut className="h-4 w-4" />
          </button>
          <button onClick={handleFullscreen} title="Fullscreen" className="p-2 rounded-full hover:bg-(--muted) transition-colors">
            <Maximize2 className="h-4 w-4" />
          </button>
          <div className="w-px h-5 bg-(--border) mx-0.5" />
          <button onClick={handleUserLocation} title="Center on my location" className="p-2 rounded-full hover:bg-(--muted) transition-colors">
            <Navigation className="h-4 w-4 -rotate-90" />
          </button>
          <button
            onClick={() => {
              setIsFiltersOpen(!isFiltersOpen);
              setIsMenuOpen(false);
            }}
            title="Filters"
            className={`p-2 rounded-full transition-colors ${isFiltersOpen ? "bg-(--muted)" : "hover:bg-(--muted)"}`}
          >
            <Filter className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setIsMenuOpen(!isMenuOpen);
              setIsFiltersOpen(false);
            }}
            title="Map layers"
            className={`p-2 rounded-full transition-colors ${isMenuOpen ? "bg-(--muted)" : "hover:bg-(--muted)"}`}
          >
            <Layers className="h-4 w-4" />
          </button>
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            className={`p-2 rounded-full transition-colors ${isMenuOpen ? "bg-(--muted)" : "hover:bg-(--muted)"}`}
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="absolute bottom-9 left-1 bg-(--card)/80 backdrop-blur-md p-3 rounded-lg border border-(--border) text-xs space-y-2 shadow-sm z-10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span>Low Turbulence</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span>Medium Turbulence</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-500" />
          <span>High Turbulence</span>
        </div>
      </div>
    </div>
  );
};

export default FlightMap;
