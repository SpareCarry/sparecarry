-- Seed 200 Popular Meetup Locations
-- Run this after creating the meetup_locations table

-- Note: This is a sample of the most popular locations
-- The full list is in lib/data/meetup-locations.ts
-- In production, you would import all 200 locations from that file

INSERT INTO public.meetup_locations (name, type, latitude, longitude, city, country) VALUES
-- GRENADA
('Port Louis Marina', 'marina', 12.0564, -61.7486, 'St. George''s', 'Grenada'),
('Clarkes Court Marina', 'marina', 12.0167, -61.7167, 'Woburn', 'Grenada'),
('Spice Island Marina', 'marina', 12.0500, -61.7500, 'St. George''s', 'Grenada'),
('Grenada Yacht Club', 'marina', 12.0500, -61.7500, 'St. George''s', 'Grenada'),
('Maurice Bishop International Airport', 'airport', 12.0042, -61.7861, 'St. George''s', 'Grenada'),
('True Blue Bay Resort Marina', 'marina', 12.0167, -61.7167, 'True Blue', 'Grenada'),
('Le Phare Bleu Marina', 'marina', 12.0167, -61.7167, 'Petit Calivigny', 'Grenada'),
('Secret Harbour Marina', 'marina', 12.0500, -61.7500, 'St. George''s', 'Grenada'),

-- DOMINICAN REPUBLIC
('Luperón Marina', 'marina', 19.8833, -70.9667, 'Luperón', 'Dominican Republic'),
('Ocean World Marina', 'marina', 19.7833, -70.6833, 'Puerto Plata', 'Dominican Republic'),
('Marina Casa de Campo', 'marina', 18.4167, -68.6667, 'La Romana', 'Dominican Republic'),
('Puerto Bahia Marina', 'marina', 19.7833, -70.6833, 'Samaná', 'Dominican Republic'),
('Las Américas International Airport', 'airport', 18.4297, -69.6689, 'Santo Domingo', 'Dominican Republic'),
('Punta Cana International Airport', 'airport', 18.5674, -68.3634, 'Punta Cana', 'Dominican Republic'),
('Gregorio Luperón International Airport', 'airport', 19.7575, -70.5700, 'Puerto Plata', 'Dominican Republic'),
('Marina Cap Cana', 'marina', 18.5667, -68.3667, 'Punta Cana', 'Dominican Republic'),

-- PANAMA
('Shelter Bay Marina', 'marina', 9.3667, -79.9500, 'Colón', 'Panama'),
('Flamenco Marina', 'marina', 8.9167, -79.5333, 'Panama City', 'Panama'),
('Las Brisas Marina', 'marina', 8.9500, -79.5500, 'Panama City', 'Panama'),
('Panama Canal Yacht Club', 'marina', 9.3500, -79.9000, 'Colón', 'Panama'),
('Tocumen International Airport', 'airport', 9.0714, -79.3836, 'Panama City', 'Panama'),
('Albrook Airport', 'airport', 8.9750, -79.5556, 'Panama City', 'Panama'),
('La Playita Marina', 'marina', 8.9167, -79.5333, 'Panama City', 'Panama'),
('Pedregal Marina', 'marina', 8.9667, -79.5500, 'Panama City', 'Panama'),

-- FRENCH POLYNESIA / TAHITI
('Papeete Marina', 'marina', -17.5333, -149.5667, 'Papeete', 'French Polynesia'),
('Port de Papeete', 'marina', -17.5333, -149.5667, 'Papeete', 'French Polynesia'),
('Faa''a International Airport', 'airport', -17.5536, -149.6069, 'Papeete', 'French Polynesia'),
('Marina Taina', 'marina', -17.5500, -149.6000, 'Punaauia', 'French Polynesia'),
('Marina de Raiatea', 'marina', -16.7167, -151.4333, 'Uturoa', 'French Polynesia'),
('Marina de Bora Bora', 'marina', -16.5000, -151.7500, 'Vaitape', 'French Polynesia'),
('Marina de Mo''orea', 'marina', -17.5333, -149.8333, 'Vaiare', 'French Polynesia'),

-- ST. LUCIA
('Rodney Bay Marina', 'marina', 14.0833, -60.9500, 'Gros Islet', 'St. Lucia'),
('Marigot Bay Marina', 'marina', 13.9167, -61.0167, 'Marigot Bay', 'St. Lucia'),
('Hewanorra International Airport', 'airport', 13.7331, -60.9528, 'Vieux Fort', 'St. Lucia'),
('George F. L. Charles Airport', 'airport', 14.0200, -60.9931, 'Castries', 'St. Lucia'),
('IGY Rodney Bay Marina', 'marina', 14.0833, -60.9500, 'Gros Islet', 'St. Lucia'),

-- ANTIGUA
('Falmouth Harbour Marina', 'marina', 17.0167, -61.7833, 'Falmouth', 'Antigua'),
('English Harbour Marina', 'marina', 17.0000, -61.7667, 'English Harbour', 'Antigua'),
('Jolly Harbour Marina', 'marina', 17.0833, -61.8833, 'Jolly Harbour', 'Antigua'),
('V.C. Bird International Airport', 'airport', 17.1367, -61.7928, 'St. John''s', 'Antigua'),
('Antigua Yacht Club Marina', 'marina', 17.0167, -61.7833, 'Falmouth', 'Antigua'),

-- ST. MARTIN / ST. MAARTEN
('Simpson Bay Marina', 'marina', 18.0333, -63.1000, 'Simpson Bay', 'St. Maarten'),
('Port de Plaisance Marina', 'marina', 18.0500, -63.0833, 'Simpson Bay', 'St. Maarten'),
('Princess Juliana International Airport', 'airport', 18.0408, -63.1089, 'St. Maarten', 'St. Maarten'),
('Marigot Marina', 'marina', 18.0667, -63.0833, 'Marigot', 'St. Martin'),
('Oyster Pond Marina', 'marina', 18.0500, -63.0333, 'Oyster Pond', 'St. Maarten'),

-- VIRGIN ISLANDS
('Crown Bay Marina', 'marina', 18.3167, -64.9333, 'Charlotte Amalie', 'US Virgin Islands'),
('Yacht Haven Grande', 'marina', 18.3333, -64.9167, 'Charlotte Amalie', 'US Virgin Islands'),
('Cyril E. King Airport', 'airport', 18.3372, -64.9733, 'St. Thomas', 'US Virgin Islands'),
('Nanny Cay Marina', 'marina', 18.4167, -64.6167, 'Road Town', 'British Virgin Islands'),
('Village Cay Marina', 'marina', 18.4167, -64.6167, 'Road Town', 'British Virgin Islands'),
('Terrance B. Lettsome International Airport', 'airport', 18.4447, -64.5431, 'Road Town', 'British Virgin Islands'),
('Moorings Marina', 'marina', 18.4167, -64.6167, 'Road Town', 'British Virgin Islands'),
('Soper''s Hole Marina', 'marina', 18.3833, -64.7000, 'West End', 'British Virgin Islands'),

-- FLORIDA, USA
('Miami International Airport', 'airport', 25.7933, -80.2906, 'Miami', 'USA'),
('Fort Lauderdale-Hollywood International Airport', 'airport', 26.0725, -80.1528, 'Fort Lauderdale', 'USA'),
('Key West International Airport', 'airport', 24.5561, -81.7594, 'Key West', 'USA'),
('Miami Beach Marina', 'marina', 25.7833, -80.1333, 'Miami Beach', 'USA'),
('Biscayne Bay Marina', 'marina', 25.7667, -80.1833, 'Miami', 'USA'),
('Port Everglades', 'marina', 26.0833, -80.1167, 'Fort Lauderdale', 'USA'),
('Bahia Mar Yachting Center', 'marina', 26.1167, -80.1000, 'Fort Lauderdale', 'USA'),
('Key West Bight Marina', 'marina', 24.5500, -81.8000, 'Key West', 'USA'),
('Stock Island Marina Village', 'marina', 24.5667, -81.7500, 'Key West', 'USA'),
('Marathon Marina', 'marina', 24.7167, -81.1000, 'Marathon', 'USA'),

-- FUEL DOCKS (Popular refueling stops)
('Starbucks Miami Airport', 'fuel_dock', 25.7933, -80.2906, 'Miami', 'USA'),
('Starbucks Fort Lauderdale Airport', 'fuel_dock', 26.0725, -80.1528, 'Fort Lauderdale', 'USA'),
('Starbucks Cancún Airport', 'fuel_dock', 21.0365, -86.8771, 'Cancún', 'Mexico'),
('Starbucks Panama Airport', 'fuel_dock', 9.0714, -79.3836, 'Panama City', 'Panama'),
('Starbucks St. Maarten Airport', 'fuel_dock', 18.0408, -63.1089, 'St. Maarten', 'St. Maarten'),
('Starbucks Barbados Airport', 'fuel_dock', 13.0747, -59.4925, 'Bridgetown', 'Barbados'),
('Starbucks Grenada Airport', 'fuel_dock', 12.0042, -61.7861, 'St. George''s', 'Grenada'),
('Starbucks St. Lucia Airport', 'fuel_dock', 13.7331, -60.9528, 'Vieux Fort', 'St. Lucia')

ON CONFLICT DO NOTHING;

-- Note: For the full 200 locations, you would need to import from lib/data/meetup-locations.ts
-- This can be done via a script or by expanding this SQL file

