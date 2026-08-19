import { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function LiveMap({
  center = [28.6139, 77.2090],
  zoom = 14,
  markers = [],
  activeMarkerId = null,
  className = 'h-64 sm:h-80 w-full',
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Check if map already initialized on this DOM element
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: true,
        attributionControl: false,
      });

      // CartoDB Dark Matter / OpenStreetMap Dark Tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      markersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Update map view if center changed
    if (center && center[0] && center[1]) {
      map.setView(center, zoom, { animate: true });
    }

    // Refresh markers
    if (markersGroupRef.current) {
      markersGroupRef.current.clearLayers();

      markers.forEach((m) => {
        if (!m.lat || !m.lng) return;

        const isSos = m.status === 'sos';
        const isCurrentActive = m.id === activeMarkerId;

        // Custom HTML Marker with pulsing aura
        const iconHtml = isSos
          ? `<div class="sos-pulse-marker" title="SOS: ${m.title || 'Emergency'}"></div>`
          : `<div class="gps-pulse-marker" title="${m.title || 'Live Location'}"></div>`;

        const customIcon = L.divIcon({
          className: 'custom-leaflet-marker',
          html: iconHtml,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          popupAnchor: [0, -12],
        });

        const marker = L.marker([m.lat, m.lng], { icon: customIcon });

        const popupContent = `
          <div style="font-family: 'Inter', sans-serif; padding: 2px 4px; min-width: 140px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: ${isSos ? '#fb7185' : '#34d399'};">
                ${isSos ? '🚨 SOS Alert' : '● Live In Transit'}
              </span>
              ${m.time ? `<span style="font-size: 9px; color: #94a3b8;">${m.time}</span>` : ''}
            </div>
            <div style="font-size: 13px; font-weight: 700; color: #ffffff; margin-bottom: 2px;">
              ${m.title || 'SafeJourney Commute'}
            </div>
            ${m.duration ? `<div style="font-size: 11px; color: #cbd5e1;">Target: ${m.duration} mins</div>` : ''}
            <div style="font-size: 9px; font-family: monospace; color: #64748b; margin-top: 4px;">
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

    // Fix tile rendering after container resize
    setTimeout(() => {
      if (map) map.invalidateSize();
    }, 250);

    return () => {
      // Map cleanup on unmount handled gracefully
    };
  }, [center, zoom, markers, activeMarkerId]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border border-slate-700/60 bg-slate-950">
      {/* Top Telemetry Overlay Chip */}
      <div className="absolute top-3 left-3 z-[400] flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-slate-700/70 shadow-lg text-[11px] font-bold text-slate-200 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
        <span>Live GPS Telemetry</span>
      </div>

      <div ref={mapContainerRef} className={`${className} w-full`} />
    </div>
  );
}
