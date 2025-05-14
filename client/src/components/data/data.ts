import L from 'leaflet';

let regionsData = {
  "Dakar": { status: "closed", color: "#ef4444", bounds: [[14.5, -17.5], [14.9, -17.3]], layer: null },
  "Diourbel": { status: "closed", color: "#ef4444", bounds: [[14.3, -16.5], [14.8, -16.0]], layer: null },
  "Fatick": { status: "partial", color: "#fbbf24", bounds: [[13.8, -16.8], [14.3, -16.3]], layer: null },
  "Kaffrine": { status: "open", color: "#10b981", bounds: [[14.0, -15.7], [14.5, -15.2]], layer: null },
  "Kaolack": { status: "partial", color: "#fbbf24", bounds: [[13.9, -16.2], [14.4, -15.7]], layer: null },
  "Kédougou": { status: "open", color: "#10b981", bounds: [[12.0, -12.5], [12.5, -11.5]], layer: null },
  "Kolda": { status: "open", color: "#10b981", bounds: [[12.5, -15.5], [13.5, -14.5]], layer: null },
  "Louga": { status: "partial", color: "#fbbf24", bounds: [[15.0, -16.5], [16.0, -15.0]], layer: null },
  "Matam": { status: "closed", color: "#ef4444", bounds: [[15.0, -14.0], [16.0, -13.0]], layer: null },
  "Saint-Louis": { status: "partial", color: "#fbbf24", bounds: [[15.5, -16.5], [16.5, -15.5]], layer: null },
  "Sédhiou": { status: "partial", color: "#fbbf24", bounds: [[12.5, -16.0], [13.0, -15.5]], layer: null },
  "Tambacounda": { status: "open", color: "#10b981", bounds: [[13.0, -14.0], [14.0, -12.0]], layer: null },
  "Thiès": { status: "partial", color: "#fbbf24", bounds: [[14.5, -17.0], [15.0, -16.5]], layer: null },
  "Ziguinchor": { status: "closed", color: "#ef4444", bounds: [[12.0, -16.5], [12.5, -16.0]], layer: null }
};

let zicsData = {
  "ZIC Djeuss": { coords: [[16.4, -16.4], [16.5, -16.3], [16.4, -16.2], [16.3, -16.3]], color: "#3b82f6", region: "Saint-Louis", department: "Dagana", status: "open", dates: "06/12/2024 - 04/05/2025 (Gibier d'eau: 06/12/2024 - 30/03/2025, Phacochère: 04/01/2025)", layer: null, marker: null },
  "ZIC Niombato": { coords: [[14.2, -16.2], [14.3, -16.1], [14.2, -16.0], [14.1, -16.1]], color: "#3b82f6", region: "Kaolack", department: "Kaolack", status: "open", dates: "06/12/2024 - 04/05/2025 (Gibier d'eau: 06/12/2024 - 30/03/2025, Phacochère: 04/01/2025)", layer: null, marker: null },
  "ZIC Baobolong": { coords: [[14.0, -16.0], [14.1, -15.9], [14.0, -15.8], [13.9, -15.9]], color: "#3b82f6", region: "Kaolack", department: "Nioro du Rip", status: "open", dates: "06/12/2024 - 04/05/2025 (Gibier d'eau: 06/12/2024 - 30/03/2025, Phacochère: 04/01/2025)", layer: null, marker: null },
  "ZIC Falémé": { coords: [[12.5, -12.5], [12.6, -12.4], [12.5, -12.3], [12.4, -12.4]], color: "#3b82f6", region: "Kédougou", department: "Saraya", status: "open", dates: "06/12/2024 - 04/05/2025 (Gibier d'eau: 06/12/2024 - 30/03/2025, Phacochère: 09/01/2025, Grande chasse: 11/01/2025 - 04/05/2025)", layer: null, marker: null }
};

let amodieesData = [
  { name: "Marigots Nord", region: "Saint-Louis", department: "Dagana", coords: [[16.5, -16.3], [16.6, -16.2], [16.5, -16.1], [16.4, -16.2]], status: "open", color: "#f472b6", layer: null, marker: null },
  { name: "Marigots Sud", region: "Saint-Louis", department: "Dagana", coords: [[16.4, -16.4], [16.5, -16.3], [16.4, -16.2], [16.3, -16.3]], status: "open", color: "#f472b6", layer: null, marker: null },
  { name: "Maka Sao 1", region: "Tambacounda", department: "Tambacounda", coords: [[13.8, -13.7], [13.9, -13.6], [13.8, -13.5], [13.7, -13.6]], status: "open", color: "#f472b6", layer: null, marker: null },
  { name: "Niériko", region: "Kédougou", department: "Kédougou", coords: [[12.4, -12.3], [12.5, -12.2], [12.4, -12.1], [12.3, -12.2]], status: "open", color: "#f472b6", layer: null, marker: null },
  { name: "Dabo", region: "Kolda", department: "Kolda", coords: [[12.9, -15.0], [13.0, -14.9], [12.9, -14.8], [12.8, -14.9]], status: "open", color: "#f472b6", layer: null, marker: null },
  { name: "Bona", region: "Sédhiou", department: "Bounkiling", coords: [[12.6, -15.7], [12.7, -15.6], [12.6, -15.5], [12.5, -15.6]], status: "open", color: "#f472b6", layer: null, marker: null },
  { name: "Nganda", region: "Kaffrine", department: "Kaffrine", coords: [[14.1, -15.5], [14.2, -15.4], [14.1, -15.3], [14.0, -15.4]], status: "open", color: "#f472b6", layer: null, marker: null },
  { name: "Caïman", region: "Fatick", department: "Foundiougne", coords: [[14.0, -16.5], [14.1, -16.4], [14.0, -16.3], [13.9, -16.4]], status: "partial", color: "#f472b6", layer: null, marker: null },
  { name: "Vallée du Ferlo", region: "Louga", department: "Louga", coords: [[15.5, -15.2], [15.6, -15.1], [15.5, -15.0], [15.4, -15.1]], status: "partial", color: "#f472b6", layer: null, marker: null }
];

function loadRegions(map?: L.Map) {
  if (!map) return;
  
  for (const region in regionsData) {
    const adjustedBounds = clampCoordinates(regionsData[region].bounds);
    regionsData[region].bounds = adjustedBounds;
    
    // Remove existing layer if it exists
    if (regionsData[region].layer) {
      map.removeLayer(regionsData[region].layer);
    }
    
    // Create and add new layer
    const area = L.rectangle(adjustedBounds, {
      color: regionsData[region].color,
      fillOpacity: 0.5,
      weight: 1,
    });
    
    // Only add to map if map is defined
    area.addTo(map);
    
    regionsData[region].layer = area;
    area.bindPopup(`<b>${region}</b><br>Statut: ${regionsData[region].status === 'open' ? 'Ouverte' : regionsData[region].status === 'partial' ? 'Partiellement ouverte' : 'Fermée'}`);
  }
}

function loadZics(map?: L.Map) {
  if (!map) return;
  
  for (const zic in zicsData) {
    const adjustedCoords = clampCoordinates(zicsData[zic].coords);
    zicsData[zic].coords = adjustedCoords;
    
    // Remove existing layers if they exist
    if (zicsData[zic].layer) {
      map.removeLayer(zicsData[zic].layer);
    }
    if (zicsData[zic].marker) {
      map.removeLayer(zicsData[zic].marker);
    }
    
    // Create polygon
    const polygon = L.polygon(adjustedCoords, {
      color: zicsData[zic].color,
      fillOpacity: 0.3,
      weight: 2,
    });
    polygon.addTo(map);
    zicsData[zic].layer = polygon;
    polygon.bindPopup(`<b>${zic}</b><br>Région: ${zicsData[zic].region}<br>Département: ${zicsData[zic].department}<br>Statut: ${zicsData[zic].status}<br>Dates: ${zicsData[zic].dates}`);
    
    // Create marker
    const center = calculatePolygonCenter(adjustedCoords);
    const marker = L.marker(center, {
      icon: L.divIcon({ className: 'zone-marker-zic' }),
    });
    marker.addTo(map).bindPopup(`<b>${zic}</b>`);
    zicsData[zic].marker = marker;
  }
}

function loadAmodiees(map?: L.Map) {
  if (!map) return;
  
  amodieesData.forEach(zone => {
    const adjustedCoords = clampCoordinates(zone.coords);
    zone.coords = adjustedCoords;
    
    // Remove existing layers if they exist
    if (zone.layer) {
      map.removeLayer(zone.layer);
    }
    if (zone.marker) {
      map.removeLayer(zone.marker);
    }
    
    // Create polygon
    const polygon = L.polygon(adjustedCoords, {
      color: zone.color,
      fillOpacity: 0.3,
      weight: 2,
    });
    polygon.addTo(map);
    zone.layer = polygon;
    polygon.bindPopup(`<b>${zone.name}</b><br>Région: ${zone.region}<br>Département: ${zone.department}<br>Statut: ${zone.status}`);
    
    // Create marker
    const center = calculatePolygonCenter(adjustedCoords);
    const marker = L.marker(center, {
      icon: L.divIcon({ className: 'zone-marker-amodiee' }),
    });
    marker.addTo(map).bindPopup(`<b>${zone.name}</b>`);
    zone.marker = marker;
  });
}

// Cette fonction garantit que les coordonnées sont dans les limites valides pour Leaflet
function clampCoordinates(coords: any) {
  // Si c'est un tableau de coordonnées pour un polygone
  if (coords.length && coords[0].length && typeof coords[0][0] === 'number') {
    return coords.map((coord: [number, number]) => [
      Math.max(-90, Math.min(90, coord[0])),
      Math.max(-180, Math.min(180, coord[1]))
    ]);
  }
  // Si c'est un rectangle (bounds)
  else if (coords.length === 2 && coords[0].length === 2 && coords[1].length === 2) {
    return [
      [Math.max(-90, Math.min(90, coords[0][0])), Math.max(-180, Math.min(180, coords[0][1]))],
      [Math.max(-90, Math.min(90, coords[1][0])), Math.max(-180, Math.min(180, coords[1][1]))]
    ];
  }
  return coords;
}

// Calculer le centre d'un polygone pour placer un marqueur
function calculatePolygonCenter(coords: [number, number][]) {
  let latSum = 0;
  let lngSum = 0;
  coords.forEach(coord => {
    latSum += coord[0];
    lngSum += coord[1];
  });
  return [latSum / coords.length, lngSum / coords.length] as [number, number];
}

export { regionsData, zicsData, amodieesData, loadRegions, loadZics, loadAmodiees, clampCoordinates, calculatePolygonCenter };