import React, { useState } from 'react';
import TabNavigation from '../components/TabNavigation';
import MapComponent from '../components/MapComponent';
import Legend from '../components/Legend';
import Accordion from '../components/Accordion';
import { regionsData, zicsData, amodieesData, loadRegions, loadZics, loadAmodiees } from '../components/data/data';

const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState('maps');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center text-green-800 mb-2">🦌 Réglementation Chasse Sénégal 2024-2025</h1>
      <p className="text-center text-gray-600 mb-8">Statuts officiels des zones et régions de chasse</p>

      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'maps' && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <i className="fas fa-map-marked-alt mr-2 text-green-600"></i> Carte Maître des Régions et Zones de Chasse
          </h2>
          <MapComponent regionsData={regionsData} zicsData={zicsData} amodieesData={amodieesData} loadRegions={loadRegions} loadZics={loadZics} loadAmodiees={loadAmodiees} />
          <Legend />
        </div>
      )}

      {activeTab === 'regulations' && (
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <i className="fas fa-book mr-2 text-green-600"></i> Statuts Officiels des Zones
          </h2>
          <Accordion title="Zones d'Intérêt Cynégétique (ZIC) - Ouvertes">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 border">Zone</th>
                  <th className="p-2 border">Région</th>
                  <th className="p-2 border">Département</th>
                  <th className="p-2 border">Statut</th>
                  <th className="p-2 border">Dates</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-gray-100">
                  <td className="p-2 border">ZIC Djeuss</td>
                  <td className="p-2 border">Saint-Louis</td>
                  <td className="p-2 border">Dagana</td>
                  <td className="p-2 border text-green-600">Ouverte</td>
                  <td className="p-2 border">06/12/2024 - 04/05/2025 (Gibier d'eau: 06/12/2024 - 30/03/2025, Phacochère: 04/01/2025)</td>
                </tr>
                <tr className="border-b hover:bg-gray-100">
                  <td className="p-2 border">ZIC Niombato</td>
                  <td className="p-2 border">Kaolack</td>
                  <td className="p-2 border">Kaolack</td>
                  <td className="p-2 border text-green-600">Ouverte</td>
                  <td className="p-2 border">06/12/2024 - 04/05/2025 (Gibier d'eau: 06/12/2024 - 30/03/2025, Phacochère: 04/01/2025)</td>
                </tr>
                <tr className="border-b hover:bg-gray-100">
                  <td className="p-2 border">ZIC Baobolong</td>
                  <td className="p-2 border">Kaolack</td>
                  <td className="p-2 border">Nioro du Rip</td>
                  <td className="p-2 border text-green-600">Ouverte (sauf tourterelle des bois)</td>
                  <td className="p-2 border">06/12/2024 - 04/05/2025 (Gibier d'eau: 06/12/2024 - 30/03/2025, Phacochère: 04/01/2025)</td>
                </tr>
                <tr className="border-b hover:bg-gray-100">
                  <td className="p-2 border">ZIC Falémé</td>
                  <td className="p-2 border">Kédougou</td>
                  <td className="p-2 border">Saraya</td>
                  <td className="p-2 border text-green-600">Ouverte</td>
                  <td className="p-2 border">06/12/2024 - 04/05/2025 (Gibier d'eau: 06/12/2024 - 30/03/2025, Phacochère: 09/01/2025, Grande chasse: 11/01/2025 - 04/05/2025)</td>
                </tr>
              </tbody>
            </table>
          </Accordion>
          <Accordion title="Régions Totalement Fermées">
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Dakar</strong> - Toute la région</li>
              <li><strong>Diourbel</strong> - Toute la région</li>
              <li><strong>Ziguinchor</strong> - Toute la région</li>
              <li><strong>Matam</strong> - Toute la région</li>
              <li><strong>Louga</strong> - Départements de Kébémer et Linguère</li>
              <li><strong>Kaolack</strong> - Zones non amodiées hors ZIC</li>
              <li><strong>Sédhiou</strong> - Zones non amodiées hors ZIC</li>
              <li><strong>Thiès</strong> - Zones côtières entre route des Niayes et Océan</li>
              <li><strong>Saint-Louis</strong> - Entre RN N°2 et Océan</li>
              <li><strong>Mbour</strong> - Entre Océan, route régionale 71 et route nationale 1</li>
            </ul>
          </Accordion>
          <Accordion title="Régions Partiellement Ouvertes">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 border">Région/Département</th>
                  <th className="p-2 border">Zones ouvertes</th>
                  <th className="p-2 border">Restrictions</th>
                  <th className="p-2 border">Dates</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-gray-100">
                  <td className="p-2 border">Louga (hors Kébémer, Linguère)</td>
                  <td className="p-2 border">Keur Momar Sarr (gibier d'eau uniquement), zones amodiées</td>
                  <td className="p-2 border">Columbidés, Cailles, Gibier d'eau</td>
                  <td className="p-2 border">06/12/2024 - 04/05/2025 (Gibier d'eau: 06/12/2024 - 30/03/2025)</td>
                </tr>
                <tr className="border-b hover:bg-gray-100">
                  <td className="p-2 border">Fatick</td>
                  <td className="p-2 border">Zones amodiées, hors Foundiougne pour francolins</td>
                  <td className="p-2 border">Columbidés, Cailles, Gibier d'eau, Francolins (max 4/jour, à partir du 06/01/2025)</td>
                  <td className="p-2 border">06/12/2024 - 04/05/2025 (Francolins: 06/01/2025 - 04/05/2025, Gibier d'eau: 06/12/2024 - 30/03/2025)</td>
                </tr>
                <tr className="border-b hover:bg-gray-100">
                  <td className="p-2 border">Thiès et Tivaouane</td>
                  <td className="p-2 border">Hors zones côtières</td>
                  <td className="p-2 border">Columbidés, Cailles, Gibier d'eau, Francolins (max 4/jour)</td>
                  <td className="p-2 border">06/12/2024 - 04/05/2025 (Francolins: 06/01/2025 - 04/05/2025, Gibier d'eau: 06/12/2024 - 30/03/2025)</td>
                </tr>
                <tr className="border-b hover:bg-gray-100">
                  <td className="p-2 border">Saint-Louis (Podor, Dagana hors zones fermées)</td>
                  <td className="p-2 border">Entre RN2 et fleuve Sénégal (Podor), zones amodiées</td>
                  <td className="p-2 border">Columbidés, Cailles, Gibier d'eau, Phacochère</td>
                  <td className="p-2 border">06/12/2024 - 04/05/2025 (Gibier d'eau: 06/12/2024 - 30/03/2025)</td>
                </tr>
                <tr className="border-b hover:bg-gray-100">
                  <td className="p-2 border">Kolda (Vélingara)</td>
                  <td className="p-2 border">Zones amodiées</td>
                  <td className="p-2 border">Gibier d'eau, Phacochère, Francolins (max 6/jour)</td>
                  <td className="p-2 border">06/12/2024 - 04/05/2025 (Francolins: 06/01/2025 - 04/05/2025, Gibier d'eau: 06/12/2024 - 30/03/2025)</td>
                </tr>
              </tbody>
            </table>
          </Accordion>
        </div>
      )}

      {activeTab === 'species' && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <i className="fas fa-dove mr-2 text-green-600"></i> Espèces Autorisées par Zone
          </h2>
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3 text-blue-800">Gibier d'eau (06/12/2024 - 30/03/2025, suspendue le 15/01/2025)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Oie de Gambie</h4>
                <p className="text-sm text-gray-600">Quota: 2 par semaine (touriste/résident)</p>
                <p className="text-sm mt-1">Zones: ZIC Djeuss, ZIC Niombato, ZIC Baobolong, ZIC Falémé, Dagana, Louga (Keur Momar Sarr), Foundiougne, Fatick, Thiès, Tivaouane, Vélingara, Sédhiou</p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Oie d'Égypte</h4>
                <p className="text-sm text-gray-600">Quota: 1 par semaine (touriste/résident)</p>
                <p className="text-sm mt-1">Zones: ZIC Djeuss, ZIC Niombato, ZIC Baobolong, ZIC Falémé, Dagana, Louga (Keur Momar Sarr), Foundiougne, Fatick, Thiès, Tivaouane, Vélingara, Sédhiou</p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Dendrocygne veuf</h4>
                <p className="text-sm text-gray-600">Quota: 8 (touriste), 10 (résident) par semaine</p>
                <p className="text-sm mt-1">Zones: ZIC Djeuss, ZIC Niombato, ZIC Baobolong, ZIC Falémé, Dagana, Louga (Keur Momar Sarr), Foundiougne, Fatick, Thiès, Tivaouane, Vélingara, Sédhiou</p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Canard casqué (Moulard)</h4>
                <p className="text-sm text-gray-600">Quota: 3 par semaine (touriste/résident)</p>
                <p className="text-sm mt-1">Zones: ZIC Djeuss, ZIC Niombato, ZIC Baobolong, ZIC Falémé, Dagana, Louga (Keur Momar Sarr), Foundiougne, Fatick, Thiès, Tivaouane, Vélingara, Sédhiou</p>
              </div>
            </div>
          </div>
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3 text-green-800">Petite chasse (06/12/2024 - 04/05/2025, Francolins à partir du 06/01/2025)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Phacochère</h4>
                <p className="text-sm text-gray-600">Quota: 1 par semaine (15,000 CFA), 2nd possible (20,000 CFA, autorisation requise)</p>
                <p className="text-sm mt-1">Zones: ZIC Djeuss, ZIC Niombato, ZIC Baobolong (04/01/2025), ZIC Falémé (09/01/2025), Foundiougne, Kaffrine, Koungheul, Bounkiling, Tambacounda, Kédougou, Kolda, Dagana, Podor (entre RN2 et fleuve), zones amodiées de Kaolack, Nioro du Rip, Louga</p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Lièvre</h4>
                <p className="text-sm text-gray-600">Quota: 2 par jour</p>
                <p className="text-sm mt-1">Zones: Kaffrine, Kédougou, Tambacounda, Kolda, zones amodiées</p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Francolin</h4>
                <p className="text-sm text-gray-600">Quota: 6 par jour (4 max à Foundiougne, Thiès, Tivaouane), fermé à Dagana</p>
                <p className="text-sm mt-1">Zones: Kédougou, Kolda, Tambacounda, Fatick (hors Foundiougne), Thiès, Tivaouane, zones amodiées</p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Pintade</h4>
                <p className="text-sm text-gray-600">Quota: 3 par jour</p>
                <p className="text-sm mt-1">Zones: Kaffrine, Kédougou, Tambacounda, Kolda, zones amodiées</p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Tourterelles/Pigeons</h4>
                <p className="text-sm text-gray-600">Quota: 20 par jour (sauf tourterelle des bois à ZIC Baobolong)</p>
                <p className="text-sm mt-1">Zones: Louga (Keur Momar Sarr), Fatick, Thiès, Tivaouane, Podor, zones amodiées, ZIC sauf Baobolong pour tourterelle des bois</p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Cailles</h4>
                <p className="text-sm text-gray-600">Quota: 20 par jour</p>
                <p className="text-sm mt-1">Zones: Louga (Keur Momar Sarr), Fatick, Thiès, Tivaouane, Podor, zones amodiées, ZIC</p>
              </div>
            </div>
          </div>
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3 text-red-800">Grande chasse (11/01/2025 - 04/05/2025)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Guib harnaché</h4>
                <p className="text-sm text-gray-600">Quota: 6 par saison</p>
                <p className="text-sm mt-1">Zones: ZIC Falémé uniquement</p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Céphalophe</h4>
                <p className="text-sm text-gray-600">Quota: 5 par saison</p>
                <p className="text-sm mt-1">Zones: ZIC Falémé uniquement</p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Hippotrague</h4>
                <p className="text-sm text-gray-600">Quota: 3 par saison</p>
                <p className="text-sm mt-1">Zones: ZIC Falémé uniquement</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;