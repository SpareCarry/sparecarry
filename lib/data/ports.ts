// Popular ports for boat trips
// This is a subset - you can expand to 500+ ports

export const popularPorts = [
  // Caribbean
  {
    name: "Rodney Bay Marina",
    country: "Saint Lucia",
    lat: 14.0833,
    lng: -60.95,
  },
  { name: "Grenada Marine", country: "Grenada", lat: 12.0522, lng: -61.7556 },
  {
    name: "Luperón Marina",
    country: "Dominican Republic",
    lat: 19.8833,
    lng: -70.95,
  },
  {
    name: "Simpson Bay Lagoon",
    country: "Sint Maarten",
    lat: 18.0333,
    lng: -63.1,
  },
  {
    name: "Nanny Cay Marina",
    country: "British Virgin Islands",
    lat: 18.4167,
    lng: -64.6167,
  },
  {
    name: "Chaguaramas Bay",
    country: "Trinidad and Tobago",
    lat: 10.6833,
    lng: -61.6167,
  },
  {
    name: "Port Louis Marina",
    country: "Martinique",
    lat: 14.7833,
    lng: -61.0667,
  },
  { name: "Marigot Bay", country: "Saint Lucia", lat: 14.0667, lng: -60.95 },
  {
    name: "English Harbour",
    country: "Antigua and Barbuda",
    lat: 17.0,
    lng: -61.7667,
  },
  {
    name: "Falmouth Harbour",
    country: "Antigua and Barbuda",
    lat: 17.0167,
    lng: -61.7833,
  },

  // Pacific
  {
    name: "Port Denarau Marina",
    country: "Fiji",
    lat: -18.1167,
    lng: 177.3167,
  },
  { name: "Vava'u Port", country: "Tonga", lat: -18.65, lng: -173.9833 },
  {
    name: "Papeete Marina",
    country: "French Polynesia",
    lat: -17.5333,
    lng: -149.5667,
  },
  { name: "Port Vila", country: "Vanuatu", lat: -17.7333, lng: 168.3167 },
  { name: "Nouméa", country: "New Caledonia", lat: -22.2758, lng: 166.458 },

  // Mediterranean
  { name: "Porto Cervo", country: "Italy", lat: 41.1333, lng: 9.5167 },
  { name: "Monaco Marina", country: "Monaco", lat: 43.7333, lng: 7.4167 },
  { name: "Palma de Mallorca", country: "Spain", lat: 39.5667, lng: 2.65 },
  { name: "Porto Montenegro", country: "Montenegro", lat: 42.4333, lng: 18.7 },
  { name: "Marina di Capri", country: "Italy", lat: 40.55, lng: 14.2333 },

  // US East Coast
  { name: "Annapolis", country: "USA", lat: 38.9784, lng: -76.4922 },
  { name: "Newport", country: "USA", lat: 41.4901, lng: -71.3128 },
  { name: "Charleston", country: "USA", lat: 32.7765, lng: -79.9311 },
  { name: "Fort Lauderdale", country: "USA", lat: 26.1224, lng: -80.1373 },
  { name: "Key West", country: "USA", lat: 24.5551, lng: -81.7821 },

  // US West Coast
  { name: "San Diego", country: "USA", lat: 32.7157, lng: -117.1611 },
  { name: "Marina del Rey", country: "USA", lat: 33.9803, lng: -118.4517 },
  { name: "San Francisco", country: "USA", lat: 37.7749, lng: -122.4194 },
  { name: "Seattle", country: "USA", lat: 47.6062, lng: -122.3321 },

  // Central America
  { name: "Panama City", country: "Panama", lat: 8.9824, lng: -79.5199 },
  { name: "Colón", country: "Panama", lat: 9.3547, lng: -79.9014 },
  { name: "Puerto Vallarta", country: "Mexico", lat: 20.6597, lng: -105.2317 },
  { name: "La Paz", country: "Mexico", lat: 24.1426, lng: -110.3128 },

  // South America
  { name: "Cartagena", country: "Colombia", lat: 10.391, lng: -75.4794 },
  { name: "Buenos Aires", country: "Argentina", lat: -34.6037, lng: -58.3816 },
  { name: "Rio de Janeiro", country: "Brazil", lat: -22.9068, lng: -43.1729 },

  // Europe
  { name: "Porto", country: "Portugal", lat: 41.1579, lng: -8.6291 },
  { name: "Gibraltar", country: "Gibraltar", lat: 36.1408, lng: -5.3536 },
  { name: "Marseille", country: "France", lat: 43.2965, lng: 5.3698 },
  { name: "Barcelona", country: "Spain", lat: 41.3851, lng: 2.1734 },

  // Asia
  { name: "Phuket", country: "Thailand", lat: 7.8804, lng: 98.3923 },
  { name: "Singapore", country: "Singapore", lat: 1.2897, lng: 103.8501 },
  { name: "Hong Kong", country: "Hong Kong", lat: 22.3193, lng: 114.1694 },

  // Australia/New Zealand
  { name: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093 },
  { name: "Auckland", country: "New Zealand", lat: -36.8485, lng: 174.7633 },
  { name: "Cairns", country: "Australia", lat: -16.9186, lng: 145.7781 },
];

export function searchPorts(query: string): typeof popularPorts {
  if (!query) return popularPorts.slice(0, 20); // Return first 20 by default

  const lowerQuery = query.toLowerCase();
  return popularPorts
    .filter(
      (port) =>
        port.name.toLowerCase().includes(lowerQuery) ||
        port.country.toLowerCase().includes(lowerQuery)
    )
    .slice(0, 20);
}
