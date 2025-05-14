import React, { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapComponentProps {
  regionsData: any;
  zicsData: any;
  amodieesData: any;
  loadRegions: (map: L.Map) => void;
  loadZics: (map: L.Map) => void;
  loadAmodiees: (map: L.Map) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({
  regionsData,
  zicsData,
  amodieesData,
  loadRegions,
  loadZics,
  loadAmodiees,
}) => {
  useEffect(() => {
    const map = L.map('map').setView([14.4974, -14.4524], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map);

    const senegalBounds = {
      minLat: 12.0,
      maxLat: 16.7,
      minLng: -17.5,
      maxLng: -11.4,
    };

    function clampCoordinates(coords: [number, number][]) {
      return coords.map(coord => [
        Math.max(senegalBounds.minLat, Math.min(senegalBounds.maxLat, coord[0])),
        Math.max(senegalBounds.minLng, Math.min(senegalBounds.maxLng, coord[1])),
      ]);
    }

    function calculatePolygonCenter(coords: [number, number][]) {
      let latSum = 0, lngSum = 0;
      coords.forEach(coord => {
        latSum += coord[0];
        lngSum += coord[1];
      });
      return [latSum / coords.length, lngSum / coords.length];
    }

    function updateLayers() {
      loadRegions(map);
      loadZics(map);
      loadAmodiees(map);
    }

    updateLayers();

    return () => {
      map.remove();
    };
  }, [regionsData, zicsData, amodieesData, loadRegions, loadZics, loadAmodiees]);

  return <div id="map" style={{ height: '600px', borderRadius: '8px', overflow: 'hidden' }} />;
};

export default MapComponent;