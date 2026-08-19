import { memo, useEffect, useRef } from 'react';
import L from 'leaflet';

function LiveMapComponent({
  center = [28.6139, 77.2090],
  zoom = 14,
  markers = [],
  activeMarkerId = null,
  className = 'h-64 sm:h-80 w-full',
  onSimulatePeril = null,
  onRecenter = null,
  showActions = true,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: true,
        attributionControl: false,
      });

      // CartoDB Voyager Light Tiles (Clean High-Fidelity SaaS style)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      markersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    if (center && center[0] && center[1]) {
      map.setView(center, zoom, { animate: true });
    }

    if (markersGroupRef.current) {
      markersGroupRef.current.clearLayers();

      markers.forEach((m) => {
        if (!m.lat || !m.lng) return;

        const isSos = m.status === 'sos';
        const isCurrentActive = m.id === activeMarkerId;

        const iconHtml = isSos
          ? `<div class="sos-pulse-marker" role="img" aria-label="SOS Incident Location" title="SOS Incident"></div>`
          : `<div class="gps-pulse-marker" role="img" aria-label="Live GPS Location" title="${m.title || 'Live GPS Location'}"></div>`;

        const customIcon = L.divIcon({
          className: 'custom-leaflet-marker',
          html: iconHtml,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
          popupAnchor: [0, -11],
        });

        const marker = L.marker([m.lat, m.lng], { icon: customIcon });

        const popupContent = `
          <div style="font-family: 'Inter', sans-serif; padding: 2px 4px; min-width: 150px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: ${isSos ? '#e11d48' : '#059669'};">
                ${isSos ? '🚨 SOS Alert' : '● Live In Transit'}
              </span>
              ${m.time ? `<span style="font-size: 9px; color: #64748b;">${m.time}</span>` : ''}
            </div>
            <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 2px;">
              ${m.title || 'SafeJourney Commute'}
            </div>
            ${m.duration ? `<div style="font-size: 11px; color: #475569;">Target: ${m.duration} mins</div>` : ''}
            <div style="font-size: 9px; font-family: monospace; color: #94a3b8; margin-top: 4px;">
              ${m.lat.toFixed(4)}° N, ${m.lng.toFixed(4)}° E
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        markersGroupRef.current.addLayer(marker);

        if (isCurrentActive) {
          marker.openPopup();
        }
      });
    }

    setTimeout(() => {
      if (map) map.invalidateSize();
    }, 200);
  }, [center, zoom, markers, activeMarkerId]);

  const handleRecenterClick = () => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView(center, zoom, { animate: true });
    }
    if (onRecenter) onRecenter();
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* SaaS Action Bar above Map */}
      {showActions && (
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRecenterClick}
              aria-label="Acquire live GPS fix and center map"
              className="bg-white border border-slate-300 hover:bg-slate-50 text-xs sm:text-sm font-semibold rounded-lg px-3.5 py-2 text-slate-700 shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
              <span>Live GPS Fix</span>
            </button>

            {onRecenter && (
              <button
                type="button"
                onClick={handleRecenterClick}
                aria-label="Recenter map view"
                className="bg-white border border-slate-300 hover:bg-slate-50 text-xs sm:text-sm font-semibold rounded-lg px-3.5 py-2 text-slate-700 shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                  <path d="M3 3v5h5"/>
                </svg>
                <span>Recenter Map</span>
              </button>
            )}
          </div>

          {onSimulatePeril && (
            <button
              type="button"
              onClick={onSimulatePeril}
              aria-label="Simulate peril to test AI distress trigger"
              className="bg-rose-50 border border-rose-200 hover:bg-rose-100 text-xs sm:text-sm font-semibold rounded-lg px-3.5 py-2 text-rose-700 shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
              title="Test distress AI escalation"
            >
              <span>🚨</span>
              <span>Simulate Peril</span>
            </button>
          )}
        </div>
      )}

      {/* Crisp Map Container with Accessibility attributes */}
      <div
        role="region"
        aria-label="Interactive Live Safety Map"
        tabIndex={0}
        className="relative w-full rounded-xl border border-slate-200 shadow-inner overflow-hidden bg-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40"
      >
        <div ref={mapContainerRef} className={`${className} w-full`} />
      </div>
    </div>
  );
}

// React.memo optimization to avoid re-rendering map when external countdown timer ticks
const LiveMap = memo(LiveMapComponent);
export default LiveMap;
