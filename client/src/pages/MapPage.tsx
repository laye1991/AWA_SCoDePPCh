import React from 'react';
import MapComponent from '@/components/MapComponent';
import { regionsData, zicsData, amodieesData, loadRegions, loadZics, loadAmodiees } from '@/components/data/data';

const MapPage: React.FC = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 text-green-800">Carte des Zones de Chasse</h1>
      <MapComponent 
        regionsData={regionsData}
        zicsData={zicsData}
        amodieesData={amodieesData}
        loadRegions={loadRegions}
        loadZics={loadZics}
        loadAmodiees={loadAmodiees}
      />
    </div>
  );
};

export default MapPage;
