// 200 Popular Meetup Locations for CarrySpace
// Mix of marinas, airports, and fuel docks in popular sailing/travel destinations

export interface MeetupLocation {
  name: string;
  type: "airport" | "marina" | "fuel_dock";
  latitude: number;
  longitude: number;
  city?: string;
  country: string;
}

export const meetupLocations: MeetupLocation[] = [
  // GRENADA
  { name: "Port Louis Marina", type: "marina", latitude: 12.0564, longitude: -61.7486, city: "St. George's", country: "Grenada" },
  { name: "Clarkes Court Marina", type: "marina", latitude: 12.0167, longitude: -61.7167, city: "Woburn", country: "Grenada" },
  { name: "Spice Island Marina", type: "marina", latitude: 12.0500, longitude: -61.7500, city: "St. George's", country: "Grenada" },
  { name: "Grenada Yacht Club", type: "marina", latitude: 12.0500, longitude: -61.7500, city: "St. George's", country: "Grenada" },
  { name: "Maurice Bishop International Airport", type: "airport", latitude: 12.0042, longitude: -61.7861, city: "St. George's", country: "Grenada" },
  { name: "True Blue Bay Resort Marina", type: "marina", latitude: 12.0167, longitude: -61.7167, city: "True Blue", country: "Grenada" },
  { name: "Le Phare Bleu Marina", type: "marina", latitude: 12.0167, longitude: -61.7167, city: "Petit Calivigny", country: "Grenada" },
  { name: "Secret Harbour Marina", type: "marina", latitude: 12.0500, longitude: -61.7500, city: "St. George's", country: "Grenada" },

  // DOMINICAN REPUBLIC
  { name: "Luperón Marina", type: "marina", latitude: 19.8833, longitude: -70.9667, city: "Luperón", country: "Dominican Republic" },
  { name: "Ocean World Marina", type: "marina", latitude: 19.7833, longitude: -70.6833, city: "Puerto Plata", country: "Dominican Republic" },
  { name: "Marina Casa de Campo", type: "marina", latitude: 18.4167, longitude: -68.6667, city: "La Romana", country: "Dominican Republic" },
  { name: "Puerto Bahia Marina", type: "marina", latitude: 19.7833, longitude: -70.6833, city: "Samaná", country: "Dominican Republic" },
  { name: "Las Américas International Airport", type: "airport", latitude: 18.4297, longitude: -69.6689, city: "Santo Domingo", country: "Dominican Republic" },
  { name: "Punta Cana International Airport", type: "airport", latitude: 18.5674, longitude: -68.3634, city: "Punta Cana", country: "Dominican Republic" },
  { name: "Gregorio Luperón International Airport", type: "airport", latitude: 19.7575, longitude: -70.5700, city: "Puerto Plata", country: "Dominican Republic" },
  { name: "Marina Cap Cana", type: "marina", latitude: 18.5667, longitude: -68.3667, city: "Punta Cana", country: "Dominican Republic" },

  // PANAMA
  { name: "Shelter Bay Marina", type: "marina", latitude: 9.3667, longitude: -79.9500, city: "Colón", country: "Panama" },
  { name: "Flamenco Marina", type: "marina", latitude: 8.9167, longitude: -79.5333, city: "Panama City", country: "Panama" },
  { name: "Las Brisas Marina", type: "marina", latitude: 8.9500, longitude: -79.5500, city: "Panama City", country: "Panama" },
  { name: "Panama Canal Yacht Club", type: "marina", latitude: 9.3500, longitude: -79.9000, city: "Colón", country: "Panama" },
  { name: "Tocumen International Airport", type: "airport", latitude: 9.0714, longitude: -79.3836, city: "Panama City", country: "Panama" },
  { name: "Albrook Airport", type: "airport", latitude: 8.9750, longitude: -79.5556, city: "Panama City", country: "Panama" },
  { name: "La Playita Marina", type: "marina", latitude: 8.9167, longitude: -79.5333, city: "Panama City", country: "Panama" },
  { name: "Pedregal Marina", type: "marina", latitude: 8.9667, longitude: -79.5500, city: "Panama City", country: "Panama" },

  // FRENCH POLYNESIA / TAHITI
  { name: "Papeete Marina", type: "marina", latitude: -17.5333, longitude: -149.5667, city: "Papeete", country: "French Polynesia" },
  { name: "Port de Papeete", type: "marina", latitude: -17.5333, longitude: -149.5667, city: "Papeete", country: "French Polynesia" },
  { name: "Faa'a International Airport", type: "airport", latitude: -17.5536, longitude: -149.6069, city: "Papeete", country: "French Polynesia" },
  { name: "Marina Taina", type: "marina", latitude: -17.5500, longitude: -149.6000, city: "Punaauia", country: "French Polynesia" },
  { name: "Marina de Raiatea", type: "marina", latitude: -16.7167, longitude: -151.4333, city: "Uturoa", country: "French Polynesia" },
  { name: "Marina de Bora Bora", type: "marina", latitude: -16.5000, longitude: -151.7500, city: "Vaitape", country: "French Polynesia" },
  { name: "Marina de Mo'orea", type: "marina", latitude: -17.5333, longitude: -149.8333, city: "Vaiare", country: "French Polynesia" },

  // ST. LUCIA
  { name: "Rodney Bay Marina", type: "marina", latitude: 14.0833, longitude: -60.9500, city: "Gros Islet", country: "St. Lucia" },
  { name: "Marigot Bay Marina", type: "marina", latitude: 13.9167, longitude: -61.0167, city: "Marigot Bay", country: "St. Lucia" },
  { name: "Hewanorra International Airport", type: "airport", latitude: 13.7331, longitude: -60.9528, city: "Vieux Fort", country: "St. Lucia" },
  { name: "George F. L. Charles Airport", type: "airport", latitude: 14.0200, longitude: -60.9931, city: "Castries", country: "St. Lucia" },
  { name: "IGY Rodney Bay Marina", type: "marina", latitude: 14.0833, longitude: -60.9500, city: "Gros Islet", country: "St. Lucia" },

  // ANTIGUA
  { name: "Falmouth Harbour Marina", type: "marina", latitude: 17.0167, longitude: -61.7833, city: "Falmouth", country: "Antigua" },
  { name: "English Harbour Marina", type: "marina", latitude: 17.0000, longitude: -61.7667, city: "English Harbour", country: "Antigua" },
  { name: "Jolly Harbour Marina", type: "marina", latitude: 17.0833, longitude: -61.8833, city: "Jolly Harbour", country: "Antigua" },
  { name: "V.C. Bird International Airport", type: "airport", latitude: 17.1367, longitude: -61.7928, city: "St. John's", country: "Antigua" },
  { name: "Antigua Yacht Club Marina", type: "marina", latitude: 17.0167, longitude: -61.7833, city: "Falmouth", country: "Antigua" },

  // MARTINIQUE
  { name: "Marina du Marin", type: "marina", latitude: 14.4667, longitude: -60.8667, city: "Le Marin", country: "Martinique" },
  { name: "Port de Fort-de-France", type: "marina", latitude: 14.6000, longitude: -61.0667, city: "Fort-de-France", country: "Martinique" },
  { name: "Martinique Aimé Césaire International Airport", type: "airport", latitude: 14.5914, longitude: -61.0031, city: "Fort-de-France", country: "Martinique" },
  { name: "Marina Pointe du Bout", type: "marina", latitude: 14.4667, longitude: -61.0833, city: "Les Trois-Îlets", country: "Martinique" },

  // GUADELOUPE
  { name: "Marina Bas-du-Fort", type: "marina", latitude: 16.2333, longitude: -61.5333, city: "Pointe-à-Pitre", country: "Guadeloupe" },
  { name: "Port de Pointe-à-Pitre", type: "marina", latitude: 16.2333, longitude: -61.5333, city: "Pointe-à-Pitre", country: "Guadeloupe" },
  { name: "Pointe-à-Pitre International Airport", type: "airport", latitude: 16.2653, longitude: -61.5317, city: "Pointe-à-Pitre", country: "Guadeloupe" },
  { name: "Marina de Saint-François", type: "marina", latitude: 16.2500, longitude: -61.2667, city: "Saint-François", country: "Guadeloupe" },

  // ST. MARTIN / ST. MAARTEN
  { name: "Simpson Bay Marina", type: "marina", latitude: 18.0333, longitude: -63.1000, city: "Simpson Bay", country: "St. Maarten" },
  { name: "Port de Plaisance Marina", type: "marina", latitude: 18.0500, longitude: -63.0833, city: "Simpson Bay", country: "St. Maarten" },
  { name: "Princess Juliana International Airport", type: "airport", latitude: 18.0408, longitude: -63.1089, city: "St. Maarten", country: "St. Maarten" },
  { name: "Marigot Marina", type: "marina", latitude: 18.0667, longitude: -63.0833, city: "Marigot", country: "St. Martin" },
  { name: "Oyster Pond Marina", type: "marina", latitude: 18.0500, longitude: -63.0333, city: "Oyster Pond", country: "St. Maarten" },

  // VIRGIN ISLANDS
  { name: "Crown Bay Marina", type: "marina", latitude: 18.3167, longitude: -64.9333, city: "Charlotte Amalie", country: "US Virgin Islands" },
  { name: "Yacht Haven Grande", type: "marina", latitude: 18.3333, longitude: -64.9167, city: "Charlotte Amalie", country: "US Virgin Islands" },
  { name: "Cyril E. King Airport", type: "airport", latitude: 18.3372, longitude: -64.9733, city: "St. Thomas", country: "US Virgin Islands" },
  { name: "Nanny Cay Marina", type: "marina", latitude: 18.4167, longitude: -64.6167, city: "Road Town", country: "British Virgin Islands" },
  { name: "Village Cay Marina", type: "marina", latitude: 18.4167, longitude: -64.6167, city: "Road Town", country: "British Virgin Islands" },
  { name: "Terrance B. Lettsome International Airport", type: "airport", latitude: 18.4447, longitude: -64.5431, city: "Road Town", country: "British Virgin Islands" },
  { name: "Moorings Marina", type: "marina", latitude: 18.4167, longitude: -64.6167, city: "Road Town", country: "British Virgin Islands" },
  { name: "Soper's Hole Marina", type: "marina", latitude: 18.3833, longitude: -64.7000, city: "West End", country: "British Virgin Islands" },

  // BARBADOS
  { name: "Port St. Charles Marina", type: "marina", latitude: 13.2833, longitude: -59.6500, city: "Speightstown", country: "Barbados" },
  { name: "Bridgetown Port", type: "marina", latitude: 13.1000, longitude: -59.6167, city: "Bridgetown", country: "Barbados" },
  { name: "Grantley Adams International Airport", type: "airport", latitude: 13.0747, longitude: -59.4925, city: "Bridgetown", country: "Barbados" },
  { name: "Carlisle Bay Marina", type: "marina", latitude: 13.1000, longitude: -59.6167, city: "Bridgetown", country: "Barbados" },

  // TRINIDAD & TOBAGO
  { name: "Chaguaramas Marina", type: "marina", latitude: 10.6833, longitude: -61.6167, city: "Chaguaramas", country: "Trinidad & Tobago" },
  { name: "Powerboats Marina", type: "marina", latitude: 10.6833, longitude: -61.6167, city: "Chaguaramas", country: "Trinidad & Tobago" },
  { name: "Piarco International Airport", type: "airport", latitude: 10.5953, longitude: -61.3372, city: "Port of Spain", country: "Trinidad & Tobago" },
  { name: "Crews Inn Marina", type: "marina", latitude: 10.6833, longitude: -61.6167, city: "Chaguaramas", country: "Trinidad & Tobago" },

  // CUBA
  { name: "Marina Hemingway", type: "marina", latitude: 23.1167, longitude: -82.4500, city: "Havana", country: "Cuba" },
  { name: "Marina Gaviota Varadero", type: "marina", latitude: 23.1333, longitude: -81.2833, city: "Varadero", country: "Cuba" },
  { name: "José Martí International Airport", type: "airport", latitude: 22.9892, longitude: -82.4092, city: "Havana", country: "Cuba" },
  { name: "Juan Gualberto Gómez Airport", type: "airport", latitude: 23.0344, longitude: -81.4353, city: "Varadero", country: "Cuba" },

  // JAMAICA
  { name: "Montego Bay Yacht Club", type: "marina", latitude: 18.4667, longitude: -77.9167, city: "Montego Bay", country: "Jamaica" },
  { name: "Errol Flynn Marina", type: "marina", latitude: 18.1833, longitude: -76.4333, city: "Port Antonio", country: "Jamaica" },
  { name: "Sangster International Airport", type: "airport", latitude: 18.5036, longitude: -77.9133, city: "Montego Bay", country: "Jamaica" },
  { name: "Norman Manley International Airport", type: "airport", latitude: 17.9356, longitude: -76.7875, city: "Kingston", country: "Jamaica" },
  { name: "Royal Jamaica Yacht Club", type: "marina", latitude: 17.9667, longitude: -76.7833, city: "Kingston", country: "Jamaica" },

  // BAHAMAS
  { name: "Nassau Yacht Haven", type: "marina", latitude: 25.0833, longitude: -77.3500, city: "Nassau", country: "Bahamas" },
  { name: "Atlantis Marina", type: "marina", latitude: 25.0833, longitude: -77.3500, city: "Nassau", country: "Bahamas" },
  { name: "Lynden Pindling International Airport", type: "airport", latitude: 25.0389, longitude: -77.4661, city: "Nassau", country: "Bahamas" },
  { name: "Marsh Harbour Marina", type: "marina", latitude: 26.5333, longitude: -77.0667, city: "Marsh Harbour", country: "Bahamas" },
  { name: "Hope Town Marina", type: "marina", latitude: 26.5333, longitude: -76.9667, city: "Hope Town", country: "Bahamas" },
  { name: "Georgetown Marina", type: "marina", latitude: 23.5167, longitude: -75.7833, city: "Georgetown", country: "Bahamas" },
  { name: "Chub Cay Marina", type: "marina", latitude: 25.4167, longitude: -77.9167, city: "Chub Cay", country: "Bahamas" },
  { name: "Bimini Big Game Club", type: "marina", latitude: 25.7333, longitude: -79.3000, city: "Bimini", country: "Bahamas" },

  // FLORIDA, USA
  { name: "Miami International Airport", type: "airport", latitude: 25.7933, longitude: -80.2906, city: "Miami", country: "USA" },
  { name: "Fort Lauderdale-Hollywood International Airport", type: "airport", latitude: 26.0725, longitude: -80.1528, city: "Fort Lauderdale", country: "USA" },
  { name: "Key West International Airport", type: "airport", latitude: 24.5561, longitude: -81.7594, city: "Key West", country: "USA" },
  { name: "Miami Beach Marina", type: "marina", latitude: 25.7833, longitude: -80.1333, city: "Miami Beach", country: "USA" },
  { name: "Biscayne Bay Marina", type: "marina", latitude: 25.7667, longitude: -80.1833, city: "Miami", country: "USA" },
  { name: "Port Everglades", type: "marina", latitude: 26.0833, longitude: -80.1167, city: "Fort Lauderdale", country: "USA" },
  { name: "Bahia Mar Yachting Center", type: "marina", latitude: 26.1167, longitude: -80.1000, city: "Fort Lauderdale", country: "USA" },
  { name: "Key West Bight Marina", type: "marina", latitude: 24.5500, longitude: -81.8000, city: "Key West", country: "USA" },
  { name: "Stock Island Marina Village", type: "marina", latitude: 24.5667, longitude: -81.7500, city: "Key West", country: "USA" },
  { name: "Marathon Marina", type: "marina", latitude: 24.7167, longitude: -81.1000, city: "Marathon", country: "USA" },

  // MEXICO
  { name: "Marina Vallarta", type: "marina", latitude: 20.6500, longitude: -105.2500, city: "Puerto Vallarta", country: "Mexico" },
  { name: "Marina Riviera Nayarit", type: "marina", latitude: 20.7500, longitude: -105.3167, city: "La Cruz", country: "Mexico" },
  { name: "Marina Ixtapa", type: "marina", latitude: 17.6667, longitude: -101.6500, city: "Ixtapa", country: "Mexico" },
  { name: "Marina Cozumel", type: "marina", latitude: 20.5000, longitude: -86.9500, city: "Cozumel", country: "Mexico" },
  { name: "Cancún International Airport", type: "airport", latitude: 21.0365, longitude: -86.8771, city: "Cancún", country: "Mexico" },
  { name: "Licenciado Gustavo Díaz Ordaz International Airport", type: "airport", latitude: 20.6803, longitude: -105.2542, city: "Puerto Vallarta", country: "Mexico" },
  { name: "Marina Puerto Escondido", type: "marina", latitude: 15.8500, longitude: -97.0667, city: "Puerto Escondido", country: "Mexico" },
  { name: "Marina La Paz", type: "marina", latitude: 24.1500, longitude: -110.3167, city: "La Paz", country: "Mexico" },
  { name: "Marina Cabo San Lucas", type: "marina", latitude: 22.8833, longitude: -109.9000, city: "Cabo San Lucas", country: "Mexico" },
  { name: "Marina Mazatlán", type: "marina", latitude: 23.2500, longitude: -106.4167, city: "Mazatlán", country: "Mexico" },

  // COLOMBIA
  { name: "Club Náutico de Cartagena", type: "marina", latitude: 10.4000, longitude: -75.5500, city: "Cartagena", country: "Colombia" },
  { name: "Marina Puerto Velero", type: "marina", latitude: 10.4000, longitude: -75.5500, city: "Cartagena", country: "Colombia" },
  { name: "Rafael Núñez International Airport", type: "airport", latitude: 10.4422, longitude: -75.5131, city: "Cartagena", country: "Colombia" },
  { name: "Marina Santa Marta", type: "marina", latitude: 11.2500, longitude: -74.2000, city: "Santa Marta", country: "Colombia" },

  // VENEZUELA
  { name: "Marina Puerto La Cruz", type: "marina", latitude: 10.2167, longitude: -64.6333, city: "Puerto La Cruz", country: "Venezuela" },
  { name: "Marina El Morro", type: "marina", latitude: 10.6000, longitude: -66.9333, city: "Caracas", country: "Venezuela" },
  { name: "Simón Bolívar International Airport", type: "airport", latitude: 10.6031, longitude: -66.9906, city: "Caracas", country: "Venezuela" },

  // BRAZIL
  { name: "Marina da Glória", type: "marina", latitude: -22.9167, longitude: -43.1667, city: "Rio de Janeiro", country: "Brazil" },
  { name: "Marina Costabella", type: "marina", latitude: -23.0167, longitude: -45.5500, city: "Angra dos Reis", country: "Brazil" },
  { name: "Rio de Janeiro-Galeão International Airport", type: "airport", latitude: -22.8089, longitude: -43.2436, city: "Rio de Janeiro", country: "Brazil" },
  { name: "Marina Verolme", type: "marina", latitude: -22.9667, longitude: -44.0333, city: "Angra dos Reis", country: "Brazil" },

  // ARGENTINA
  { name: "Marina Puerto Madero", type: "marina", latitude: -34.6000, longitude: -58.3667, city: "Buenos Aires", country: "Argentina" },
  { name: "Aeroparque Jorge Newbery", type: "airport", latitude: -34.5592, longitude: -58.4156, city: "Buenos Aires", country: "Argentina" },
  { name: "Ezeiza International Airport", type: "airport", latitude: -34.8222, longitude: -58.5358, city: "Buenos Aires", country: "Argentina" },

  // CHILE
  { name: "Marina del Sur", type: "marina", latitude: -33.0167, longitude: -71.6333, city: "Valparaíso", country: "Chile" },
  { name: "Arturo Merino Benítez International Airport", type: "airport", latitude: -33.3931, longitude: -70.7858, city: "Santiago", country: "Chile" },

  // ECUADOR
  { name: "Marina Puerto Lucía", type: "marina", latitude: -2.2167, longitude: -80.9167, city: "Salinas", country: "Ecuador" },
  { name: "José Joaquín de Olmedo International Airport", type: "airport", latitude: -2.1572, longitude: -79.8836, city: "Guayaquil", country: "Ecuador" },

  // PERU
  { name: "Marina del Callao", type: "marina", latitude: -12.0667, longitude: -77.1333, city: "Callao", country: "Peru" },
  { name: "Jorge Chávez International Airport", type: "airport", latitude: -12.0219, longitude: -77.1144, city: "Lima", country: "Peru" },

  // GALAPAGOS
  { name: "Marina Puerto Ayora", type: "marina", latitude: -0.7500, longitude: -90.3167, city: "Puerto Ayora", country: "Ecuador" },
  { name: "Seymour Airport", type: "airport", latitude: -0.4500, longitude: -90.2667, city: "Baltra", country: "Ecuador" },

  // COSTA RICA
  { name: "Marina Pez Vela", type: "marina", latitude: 9.3833, longitude: -84.1333, city: "Quepos", country: "Costa Rica" },
  { name: "Marina Flamingo", type: "marina", latitude: 10.4500, longitude: -85.8167, city: "Flamingo", country: "Costa Rica" },
  { name: "Juan Santamaría International Airport", type: "airport", latitude: 9.9939, longitude: -84.2089, city: "San José", country: "Costa Rica" },
  { name: "Marina Papagayo", type: "marina", latitude: 10.5500, longitude: -85.7000, city: "Gulf of Papagayo", country: "Costa Rica" },

  // NICARAGUA
  { name: "Marina Puesta del Sol", type: "marina", latitude: 12.4833, longitude: -87.1667, city: "Chinandega", country: "Nicaragua" },
  { name: "Augusto C. Sandino International Airport", type: "airport", latitude: 12.1417, longitude: -86.1681, city: "Managua", country: "Nicaragua" },

  // HONDURAS
  { name: "Marina La Ceiba", type: "marina", latitude: 15.7667, longitude: -86.8000, city: "La Ceiba", country: "Honduras" },
  { name: "Ramón Villeda Morales International Airport", type: "airport", latitude: 15.7331, longitude: -86.8500, city: "La Ceiba", country: "Honduras" },

  // BELIZE
  { name: "Marina Belize City", type: "marina", latitude: 17.5000, longitude: -88.1833, city: "Belize City", country: "Belize" },
  { name: "Philip S. W. Goldson International Airport", type: "airport", latitude: 17.5392, longitude: -88.3081, city: "Belize City", country: "Belize" },
  { name: "Marina San Pedro", type: "marina", latitude: 17.9167, longitude: -87.9667, city: "San Pedro", country: "Belize" },

  // GUATEMALA
  { name: "Marina Pez Vela", type: "marina", latitude: 13.9333, longitude: -90.8167, city: "Puerto Quetzal", country: "Guatemala" },
  { name: "La Aurora International Airport", type: "airport", latitude: 14.5833, longitude: -90.5275, city: "Guatemala City", country: "Guatemala" },

  // EL SALVADOR
  { name: "Marina Bahía del Sol", type: "marina", latitude: 13.3167, longitude: -87.8500, city: "La Unión", country: "El Salvador" },
  { name: "Monseñor Óscar Arnulfo Romero International Airport", type: "airport", latitude: 13.4406, longitude: -89.0558, city: "San Salvador", country: "El Salvador" },

  // MEDITERRANEAN - SPAIN
  { name: "Marina Port Vell", type: "marina", latitude: 41.3667, longitude: 2.1833, city: "Barcelona", country: "Spain" },
  { name: "Marina Real Juan Carlos I", type: "marina", latitude: 39.4667, longitude: -0.3167, city: "Valencia", country: "Spain" },
  { name: "Barcelona-El Prat Airport", type: "airport", latitude: 41.2971, longitude: 2.0785, city: "Barcelona", country: "Spain" },
  { name: "Palma de Mallorca Airport", type: "airport", latitude: 39.5517, longitude: 2.7389, city: "Palma", country: "Spain" },
  { name: "Marina Port de Mallorca", type: "marina", latitude: 39.5667, longitude: 2.6167, city: "Palma", country: "Spain" },

  // MEDITERRANEAN - FRANCE
  { name: "Port de Nice", type: "marina", latitude: 43.6833, longitude: 7.2833, city: "Nice", country: "France" },
  { name: "Port Vauban", type: "marina", latitude: 43.5333, longitude: 7.1167, city: "Antibes", country: "France" },
  { name: "Nice Côte d'Azur Airport", type: "airport", latitude: 43.6653, longitude: 7.2150, city: "Nice", country: "France" },
  { name: "Port de Cannes", type: "marina", latitude: 43.5500, longitude: 7.0167, city: "Cannes", country: "France" },

  // MEDITERRANEAN - ITALY
  { name: "Marina di Portofino", type: "marina", latitude: 44.3000, longitude: 9.2000, city: "Portofino", country: "Italy" },
  { name: "Marina di Genova", type: "marina", latitude: 44.4000, longitude: 8.9333, city: "Genoa", country: "Italy" },
  { name: "Genoa Cristoforo Colombo Airport", type: "airport", latitude: 44.4133, longitude: 8.8375, city: "Genoa", country: "Italy" },
  { name: "Marina di Capri", type: "marina", latitude: 40.5500, longitude: 14.2333, city: "Capri", country: "Italy" },

  // MEDITERRANEAN - GREECE
  { name: "Marina Zea", type: "marina", latitude: 37.9333, longitude: 23.6333, city: "Piraeus", country: "Greece" },
  { name: "Marina Alimos", type: "marina", latitude: 37.9167, longitude: 23.7167, city: "Athens", country: "Greece" },
  { name: "Athens International Airport", type: "airport", latitude: 37.9364, longitude: 23.9444, city: "Athens", country: "Greece" },
  { name: "Marina Gouvia", type: "marina", latitude: 39.6500, longitude: 19.8500, city: "Corfu", country: "Greece" },

  // MEDITERRANEAN - TURKEY
  { name: "Marmaris Marina", type: "marina", latitude: 36.8500, longitude: 28.2667, city: "Marmaris", country: "Turkey" },
  { name: "Bodrum Marina", type: "marina", latitude: 37.0333, longitude: 27.4333, city: "Bodrum", country: "Turkey" },
  { name: "Milas-Bodrum Airport", type: "airport", latitude: 37.2500, longitude: 27.6667, city: "Bodrum", country: "Turkey" },
  { name: "Fethiye Marina", type: "marina", latitude: 36.6167, longitude: 29.1167, city: "Fethiye", country: "Turkey" },

  // SOUTH AFRICA
  { name: "V&A Waterfront Marina", type: "marina", latitude: -33.9000, longitude: 18.4167, city: "Cape Town", country: "South Africa" },
  { name: "Cape Town International Airport", type: "airport", latitude: -33.9694, longitude: 18.5972, city: "Cape Town", country: "South Africa" },
  { name: "Simon's Town Marina", type: "marina", latitude: -34.1833, longitude: 18.4333, city: "Simon's Town", country: "South Africa" },

  // AUSTRALIA
  { name: "Sydney Harbour Marina", type: "marina", latitude: -33.8667, longitude: 151.2000, city: "Sydney", country: "Australia" },
  { name: "Sydney Kingsford Smith Airport", type: "airport", latitude: -33.9399, longitude: 151.1753, city: "Sydney", country: "Australia" },
  { name: "Marina Mirage", type: "marina", latitude: -16.5167, longitude: 145.4667, city: "Port Douglas", country: "Australia" },
  { name: "Hamilton Island Marina", type: "marina", latitude: -20.3500, longitude: 148.9500, city: "Hamilton Island", country: "Australia" },

  // NEW ZEALAND
  { name: "Westhaven Marina", type: "marina", latitude: -36.8333, longitude: 174.7500, city: "Auckland", country: "New Zealand" },
  { name: "Auckland International Airport", type: "airport", latitude: -37.0082, longitude: 174.7850, city: "Auckland", country: "New Zealand" },
  { name: "Opua Marina", type: "marina", latitude: -35.3167, longitude: 174.1167, city: "Opua", country: "New Zealand" },

  // THAILAND
  { name: "Royal Phuket Marina", type: "marina", latitude: 7.9833, longitude: 98.3500, city: "Phuket", country: "Thailand" },
  { name: "Phuket International Airport", type: "airport", latitude: 8.1133, longitude: 98.3169, city: "Phuket", country: "Thailand" },
  { name: "Ao Chalong Yacht Club", type: "marina", latitude: 7.8333, longitude: 98.3667, city: "Phuket", country: "Thailand" },

  // MALAYSIA
  { name: "Straits Quay Marina", type: "marina", latitude: 5.4500, longitude: 100.3167, city: "Penang", country: "Malaysia" },
  { name: "Penang International Airport", type: "airport", latitude: 5.2972, longitude: 100.2769, city: "Penang", country: "Malaysia" },
  { name: "Puteri Harbour Marina", type: "marina", latitude: 1.4167, longitude: 103.6333, city: "Johor", country: "Malaysia" },

  // SINGAPORE
  { name: "ONE°15 Marina Club", type: "marina", latitude: 1.2667, longitude: 103.8333, city: "Singapore", country: "Singapore" },
  { name: "Raffles Marina", type: "marina", latitude: 1.2833, longitude: 103.7500, city: "Singapore", country: "Singapore" },
  { name: "Changi Airport", type: "airport", latitude: 1.3644, longitude: 103.9915, city: "Singapore", country: "Singapore" },

  // INDONESIA
  { name: "Marina Batavia", type: "marina", latitude: -6.1167, longitude: 106.8167, city: "Jakarta", country: "Indonesia" },
  { name: "Soekarno-Hatta International Airport", type: "airport", latitude: -6.1256, longitude: 106.6558, city: "Jakarta", country: "Indonesia" },
  { name: "Marina del Rey Bali", type: "marina", latitude: -8.6833, longitude: 115.2167, city: "Bali", country: "Indonesia" },

  // PHILIPPINES
  { name: "Subic Bay Marina", type: "marina", latitude: 14.8000, longitude: 120.2833, city: "Subic", country: "Philippines" },
  { name: "Ninoy Aquino International Airport", type: "airport", latitude: 14.5086, longitude: 121.0194, city: "Manila", country: "Philippines" },
  { name: "Puerto Galera Yacht Club", type: "marina", latitude: 13.5000, longitude: 121.9667, city: "Puerto Galera", country: "Philippines" },

  // FUEL DOCKS (Popular refueling stops)
  { name: "Starbucks Miami Airport", type: "fuel_dock", latitude: 25.7933, longitude: -80.2906, city: "Miami", country: "USA" },
  { name: "Starbucks Fort Lauderdale Airport", type: "fuel_dock", latitude: 26.0725, longitude: -80.1528, city: "Fort Lauderdale", country: "USA" },
  { name: "Starbucks Cancún Airport", type: "fuel_dock", latitude: 21.0365, longitude: -86.8771, city: "Cancún", country: "Mexico" },
  { name: "Starbucks Panama Airport", type: "fuel_dock", latitude: 9.0714, longitude: -79.3836, city: "Panama City", country: "Panama" },
  { name: "Starbucks St. Maarten Airport", type: "fuel_dock", latitude: 18.0408, longitude: -63.1089, city: "St. Maarten", country: "St. Maarten" },
  { name: "Starbucks Barbados Airport", type: "fuel_dock", latitude: 13.0747, longitude: -59.4925, city: "Bridgetown", country: "Barbados" },
  { name: "Starbucks Grenada Airport", type: "fuel_dock", latitude: 12.0042, longitude: -61.7861, city: "St. George's", country: "Grenada" },
  { name: "Starbucks St. Lucia Airport", type: "fuel_dock", latitude: 13.7331, longitude: -60.9528, city: "Vieux Fort", country: "St. Lucia" },
];

export function searchMeetupLocations(query: string): MeetupLocation[] {
  const lowerQuery = query.toLowerCase();
  return meetupLocations.filter(
    (location) =>
      location.name.toLowerCase().includes(lowerQuery) ||
      location.city?.toLowerCase().includes(lowerQuery) ||
      location.country.toLowerCase().includes(lowerQuery)
  );
}

export function getMeetupLocationById(id: string): MeetupLocation | undefined {
  // For now, return by index (in production, use actual IDs from database)
  const index = parseInt(id, 10);
  return meetupLocations[index];
}

