/**
 * Item Templates for Quick Selection
 * Focus on common boat/yacht items where weight and dimensions can be easily inferred
 */

export interface ItemTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  keywords: string[]; // For search and detection matching
}

export const ITEM_TEMPLATES: ItemTemplate[] = [
  // ========================================
  // Batteries & Electrical Systems
  // ========================================
  {
    id: "battery-marine-100ah",
    title: "Marine Battery 100Ah",
    description: "Deep cycle marine battery, 100 amp hours",
    category: "electrical_systems",
    keywords: ["battery", "marine", "100ah", "100 ah", "deep cycle"],
  },
  {
    id: "battery-marine-200ah",
    title: "Marine Battery 200Ah",
    description: "Deep cycle marine battery, 200 amp hours",
    category: "electrical_systems",
    keywords: ["battery", "marine", "200ah", "200 ah", "deep cycle"],
  },
  {
    id: "battery-lithium-100ah",
    title: "Lithium Battery 100Ah",
    description: "Lithium marine battery, 100 amp hours",
    category: "electrical_systems",
    keywords: ["battery", "lithium", "100ah", "100 ah", "li-ion"],
  },
  {
    id: "battery-agm-100ah",
    title: "AGM Battery 100Ah",
    description: "AGM (Absorbent Glass Mat) marine battery, 100 amp hours",
    category: "electrical_systems",
    keywords: ["battery", "agm", "100ah", "100 ah"],
  },
  {
    id: "solar-panel-100w",
    title: "Solar Panel 100W",
    description: "100 watt solar panel for marine use",
    category: "electrical_systems",
    keywords: ["solar", "panel", "100w", "100 w", "photovoltaic"],
  },
  {
    id: "solar-panel-200w",
    title: "Solar Panel 200W",
    description: "200 watt solar panel for marine use",
    category: "electrical_systems",
    keywords: ["solar", "panel", "200w", "200 w", "photovoltaic"],
  },
  {
    id: "solar-panel-300w",
    title: "Solar Panel 300W",
    description: "300 watt solar panel for marine use",
    category: "electrical_systems",
    keywords: ["solar", "panel", "300w", "300 w", "photovoltaic"],
  },
  {
    id: "wind-generator-400w",
    title: "Wind Generator 400W",
    description: "400 watt wind generator for marine use",
    category: "electrical_systems",
    keywords: ["wind", "generator", "400w", "400 w", "turbine"],
  },
  {
    id: "wind-generator-600w",
    title: "Wind Generator 600W",
    description: "600 watt wind generator for marine use",
    category: "electrical_systems",
    keywords: ["wind", "generator", "600w", "600 w", "turbine"],
  },
  {
    id: "inverter-1000w",
    title: "Inverter 1000W",
    description: "1000 watt power inverter",
    category: "electrical_systems",
    keywords: ["inverter", "1000w", "1000 w", "power"],
  },
  {
    id: "inverter-2000w",
    title: "Inverter 2000W",
    description: "2000 watt power inverter",
    category: "electrical_systems",
    keywords: ["inverter", "2000w", "2000 w", "power"],
  },
  {
    id: "inverter-3000w",
    title: "Inverter 3000W",
    description: "3000 watt power inverter",
    category: "electrical_systems",
    keywords: ["inverter", "3000w", "3000 w", "power"],
  },
  {
    id: "battery-charger-10a",
    title: "Battery Charger 10A",
    description: "10 amp battery charger",
    category: "electrical_systems",
    keywords: ["charger", "battery", "10amp", "10 amp"],
  },
  {
    id: "battery-charger-20a",
    title: "Battery Charger 20A",
    description: "20 amp battery charger",
    category: "electrical_systems",
    keywords: ["charger", "battery", "20amp", "20 amp"],
  },
  {
    id: "battery-charger-40a",
    title: "Battery Charger 40A",
    description: "40 amp battery charger",
    category: "electrical_systems",
    keywords: ["charger", "battery", "40amp", "40 amp"],
  },
  {
    id: "shore-power-25ft",
    title: "Shore Power Cord 25ft",
    description: "25 foot shore power cord",
    category: "electrical_systems",
    keywords: ["shore", "power", "cord", "cable", "25ft", "25 ft"],
  },
  {
    id: "shore-power-50ft",
    title: "Shore Power Cord 50ft",
    description: "50 foot shore power cord",
    category: "electrical_systems",
    keywords: ["shore", "power", "cord", "cable", "50ft", "50 ft"],
  },

  // ========================================
  // Anchoring
  // ========================================
  {
    id: "anchor-5kg",
    title: "Anchor 5kg",
    description: "5 kilogram anchor",
    category: "anchoring",
    keywords: ["anchor", "5kg", "5 kg"],
  },
  {
    id: "anchor-10kg",
    title: "Anchor 10kg",
    description: "10 kilogram anchor",
    category: "anchoring",
    keywords: ["anchor", "10kg", "10 kg"],
  },
  {
    id: "anchor-15kg",
    title: "Anchor 15kg",
    description: "15 kilogram anchor",
    category: "anchoring",
    keywords: ["anchor", "15kg", "15 kg"],
  },
  {
    id: "anchor-20kg",
    title: "Anchor 20kg",
    description: "20 kilogram anchor",
    category: "anchoring",
    keywords: ["anchor", "20kg", "20 kg"],
  },
  {
    id: "anchor-25kg",
    title: "Anchor 25kg",
    description: "25 kilogram anchor",
    category: "anchoring",
    keywords: ["anchor", "25kg", "25 kg"],
  },
  {
    id: "anchor-chain-50ft",
    title: "Anchor Chain 50ft",
    description: "50 foot anchor chain",
    category: "anchoring",
    keywords: ["chain", "anchor", "50ft", "50 ft"],
  },
  {
    id: "anchor-chain-100ft",
    title: "Anchor Chain 100ft",
    description: "100 foot anchor chain",
    category: "anchoring",
    keywords: ["chain", "anchor", "100ft", "100 ft"],
  },
  {
    id: "anchor-chain-200ft",
    title: "Anchor Chain 200ft",
    description: "200 foot anchor chain",
    category: "anchoring",
    keywords: ["chain", "anchor", "200ft", "200 ft"],
  },
  {
    id: "anchor-rode-200ft",
    title: "Anchor Rode 200ft",
    description: "200 foot anchor rode",
    category: "anchoring",
    keywords: ["rode", "anchor", "200ft", "200 ft", "line"],
  },
  {
    id: "windlass",
    title: "Windlass",
    description: "Electric or manual anchor windlass",
    category: "anchoring",
    keywords: ["windlass", "anchor", "winch"],
  },
  {
    id: "dock-lines-25ft",
    title: "Dock Lines 25ft",
    description: "25 foot dock lines (set of 4)",
    category: "anchoring",
    keywords: ["dock", "line", "lines", "25ft", "25 ft", "mooring"],
  },
  {
    id: "dock-lines-50ft",
    title: "Dock Lines 50ft",
    description: "50 foot dock lines (set of 4)",
    category: "anchoring",
    keywords: ["dock", "line", "lines", "50ft", "50 ft", "mooring"],
  },

  // ========================================
  // Propulsion
  // ========================================
  {
    id: "outboard-15hp",
    title: "Outboard Motor 15hp",
    description: "15 horsepower outboard motor",
    category: "engine_parts",
    keywords: ["outboard", "motor", "engine", "15hp", "15 hp"],
  },
  {
    id: "outboard-40hp",
    title: "Outboard Motor 40hp",
    description: "40 horsepower outboard motor",
    category: "engine_parts",
    keywords: ["outboard", "motor", "engine", "40hp", "40 hp"],
  },
  {
    id: "outboard-60hp",
    title: "Outboard Motor 60hp",
    description: "60 horsepower outboard motor",
    category: "engine_parts",
    keywords: ["outboard", "motor", "engine", "60hp", "60 hp"],
  },
  {
    id: "propeller-10inch",
    title: "Propeller 10 inch",
    description: "10 inch diameter propeller",
    category: "engine_parts",
    keywords: ["propeller", "prop", "10inch", "10 inch", "10\""],
  },
  {
    id: "propeller-12inch",
    title: "Propeller 12 inch",
    description: "12 inch diameter propeller",
    category: "engine_parts",
    keywords: ["propeller", "prop", "12inch", "12 inch", "12\""],
  },
  {
    id: "propeller-14inch",
    title: "Propeller 14 inch",
    description: "14 inch diameter propeller",
    category: "engine_parts",
    keywords: ["propeller", "prop", "14inch", "14 inch", "14\""],
  },
  {
    id: "propeller-16inch",
    title: "Propeller 16 inch",
    description: "16 inch diameter propeller",
    category: "engine_parts",
    keywords: ["propeller", "prop", "16inch", "16 inch", "16\""],
  },
  {
    id: "prop-shaft",
    title: "Propeller Shaft",
    description: "Propeller shaft",
    category: "engine_parts",
    keywords: ["prop", "shaft", "propeller", "driveshaft"],
  },
  {
    id: "impeller",
    title: "Impeller",
    description: "Water pump impeller",
    category: "engine_parts",
    keywords: ["impeller", "pump", "water"],
  },

  // ========================================
  // Sails & Rigging
  // ========================================
  {
    id: "mainsail",
    title: "Mainsail",
    description: "Main sail",
    category: "sails_rigging",
    keywords: ["sail", "main", "mainsail"],
  },
  {
    id: "genoa",
    title: "Genoa",
    description: "Genoa jib sail",
    category: "sails_rigging",
    keywords: ["sail", "genoa", "jib"],
  },
  {
    id: "jib",
    title: "Jib",
    description: "Jib sail",
    category: "sails_rigging",
    keywords: ["sail", "jib"],
  },
  {
    id: "spinnaker",
    title: "Spinnaker",
    description: "Spinnaker sail",
    category: "sails_rigging",
    keywords: ["sail", "spinnaker", "chute"],
  },
  {
    id: "mast-30ft",
    title: "Mast 30ft",
    description: "30 foot mast",
    category: "sails_rigging",
    keywords: ["mast", "30ft", "30 ft"],
  },
  {
    id: "mast-40ft",
    title: "Mast 40ft",
    description: "40 foot mast",
    category: "sails_rigging",
    keywords: ["mast", "40ft", "40 ft"],
  },
  {
    id: "mast-50ft",
    title: "Mast 50ft",
    description: "50 foot mast",
    category: "sails_rigging",
    keywords: ["mast", "50ft", "50 ft"],
  },
  {
    id: "boom",
    title: "Boom",
    description: "Boom for mainsail",
    category: "sails_rigging",
    keywords: ["boom", "sail"],
  },
  {
    id: "rigging",
    title: "Rigging",
    description: "Running rigging lines",
    category: "sails_rigging",
    keywords: ["rigging", "line", "rope"],
  },
  {
    id: "standing-rigging",
    title: "Standing Rigging",
    description: "Standing rigging (stays and shrouds)",
    category: "sails_rigging",
    keywords: ["rigging", "standing", "stay", "shroud"],
  },
  {
    id: "winch",
    title: "Winch",
    description: "Sail winch",
    category: "sails_rigging",
    keywords: ["winch", "sail"],
  },
  {
    id: "blocks",
    title: "Blocks",
    description: "Rigging blocks (set)",
    category: "sails_rigging",
    keywords: ["block", "blocks", "pulley"],
  },
  {
    id: "rope-50ft",
    title: "Rope/Line 50ft",
    description: "50 foot rope or line",
    category: "sails_rigging",
    keywords: ["rope", "line", "50ft", "50 ft"],
  },
  {
    id: "rope-100ft",
    title: "Rope/Line 100ft",
    description: "100 foot rope or line",
    category: "sails_rigging",
    keywords: ["rope", "line", "100ft", "100 ft"],
  },
  {
    id: "rope-200ft",
    title: "Rope/Line 200ft",
    description: "200 foot rope or line",
    category: "sails_rigging",
    keywords: ["rope", "line", "200ft", "200 ft"],
  },

  // ========================================
  // Hull & Deck
  // ========================================
  {
    id: "rudder",
    title: "Rudder",
    description: "Boat rudder",
    category: "hull_parts",
    keywords: ["rudder", "steering"],
  },
  {
    id: "keel",
    title: "Keel",
    description: "Sailboat keel",
    category: "hull_parts",
    keywords: ["keel", "ballast"],
  },
  {
    id: "fender-4inch",
    title: "Fender 4 inch",
    description: "4 inch diameter fender",
    category: "deck_hardware",
    keywords: ["fender", "4inch", "4 inch", "4\""],
  },
  {
    id: "fender-6inch",
    title: "Fender 6 inch",
    description: "6 inch diameter fender",
    category: "deck_hardware",
    keywords: ["fender", "6inch", "6 inch", "6\""],
  },
  {
    id: "fender-8inch",
    title: "Fender 8 inch",
    description: "8 inch diameter fender",
    category: "deck_hardware",
    keywords: ["fender", "8inch", "8 inch", "8\""],
  },
  {
    id: "chainplates",
    title: "Chainplates",
    description: "Chainplates (set)",
    category: "sails_rigging",
    keywords: ["chainplate", "chainplates", "rigging"],
  },
  {
    id: "turnbuckles",
    title: "Turnbuckles",
    description: "Turnbuckles for rigging (set)",
    category: "sails_rigging",
    keywords: ["turnbuckle", "turnbuckles", "rigging"],
  },

  // ========================================
  // Marine Electronics
  // ========================================
  {
    id: "chartplotter",
    title: "Chartplotter",
    description: "Marine chartplotter/GPS",
    category: "marine_electronics",
    keywords: ["chartplotter", "chart", "plotter", "gps"],
  },
  {
    id: "gps",
    title: "GPS",
    description: "Marine GPS unit",
    category: "marine_electronics",
    keywords: ["gps", "navigator"],
  },
  {
    id: "vhf-radio",
    title: "VHF Radio",
    description: "VHF marine radio",
    category: "marine_electronics",
    keywords: ["vhf", "radio", "marine"],
  },
  {
    id: "radar-18inch",
    title: "Radar 18 inch",
    description: "18 inch marine radar",
    category: "marine_electronics",
    keywords: ["radar", "18inch", "18 inch", "18\""],
  },
  {
    id: "radar-24inch",
    title: "Radar 24 inch",
    description: "24 inch marine radar",
    category: "marine_electronics",
    keywords: ["radar", "24inch", "24 inch", "24\""],
  },
  {
    id: "ais",
    title: "AIS Transponder",
    description: "AIS (Automatic Identification System) transponder",
    category: "marine_electronics",
    keywords: ["ais", "transponder"],
  },
  {
    id: "epirb",
    title: "EPIRB",
    description: "Emergency Position Indicating Radio Beacon",
    category: "safety_equipment",
    keywords: ["epirb", "emergency", "beacon"],
  },
  {
    id: "autopilot",
    title: "Autopilot",
    description: "Marine autopilot system",
    category: "marine_electronics",
    keywords: ["autopilot", "auto", "pilot"],
  },
  {
    id: "depth-sounder",
    title: "Depth Sounder",
    description: "Depth sounder / fish finder",
    category: "marine_electronics",
    keywords: ["depth", "sounder", "fish", "finder"],
  },
  {
    id: "navigation-lights",
    title: "Navigation Lights",
    description: "Marine navigation lights (set)",
    category: "marine_electronics",
    keywords: ["navigation", "light", "lights", "nav"],
  },

  // ========================================
  // Safety Equipment
  // ========================================
  {
    id: "life-raft-4person",
    title: "Life Raft 4-person",
    description: "4-person life raft",
    category: "safety_equipment",
    keywords: ["life", "raft", "4person", "4 person"],
  },
  {
    id: "life-raft-6person",
    title: "Life Raft 6-person",
    description: "6-person life raft",
    category: "safety_equipment",
    keywords: ["life", "raft", "6person", "6 person"],
  },
  {
    id: "life-jacket",
    title: "PFD / Life Jacket",
    description: "Personal Flotation Device (PFD) / Life jacket",
    category: "safety_equipment",
    keywords: ["pfd", "life", "jacket", "vest"],
  },
  {
    id: "fire-extinguisher-2lb",
    title: "Fire Extinguisher 2lb",
    description: "2 pound fire extinguisher",
    category: "safety_equipment",
    keywords: ["fire", "extinguisher", "2lb", "2 lb"],
  },
  {
    id: "fire-extinguisher-5lb",
    title: "Fire Extinguisher 5lb",
    description: "5 pound fire extinguisher",
    category: "safety_equipment",
    keywords: ["fire", "extinguisher", "5lb", "5 lb"],
  },
  {
    id: "plb",
    title: "PLB",
    description: "Personal Locator Beacon",
    category: "safety_equipment",
    keywords: ["plb", "beacon", "personal", "locator"],
  },

  // ========================================
  // Plumbing Systems
  // ========================================
  {
    id: "watermaker-6gph",
    title: "Watermaker 6gph",
    description: "Watermaker / desalination unit, 6 gallons per hour",
    category: "plumbing_systems",
    keywords: ["watermaker", "desalination", "6gph", "6 gph"],
  },
  {
    id: "watermaker-12gph",
    title: "Watermaker 12gph",
    description: "Watermaker / desalination unit, 12 gallons per hour",
    category: "plumbing_systems",
    keywords: ["watermaker", "desalination", "12gph", "12 gph"],
  },
  {
    id: "bilge-pump-500gph",
    title: "Bilge Pump 500gph",
    description: "Bilge pump, 500 gallons per hour",
    category: "plumbing_systems",
    keywords: ["bilge", "pump", "500gph", "500 gph"],
  },
  {
    id: "bilge-pump-1000gph",
    title: "Bilge Pump 1000gph",
    description: "Bilge pump, 1000 gallons per hour",
    category: "plumbing_systems",
    keywords: ["bilge", "pump", "1000gph", "1000 gph"],
  },
  {
    id: "bilge-pump-2000gph",
    title: "Bilge Pump 2000gph",
    description: "Bilge pump, 2000 gallons per hour",
    category: "plumbing_systems",
    keywords: ["bilge", "pump", "2000gph", "2000 gph"],
  },
  {
    id: "fuel-tank-10gal",
    title: "Fuel Tank 10gal",
    description: "10 gallon fuel tank",
    category: "plumbing_systems",
    keywords: ["fuel", "tank", "10gal", "10 gal"],
  },
  {
    id: "fuel-tank-20gal",
    title: "Fuel Tank 20gal",
    description: "20 gallon fuel tank",
    category: "plumbing_systems",
    keywords: ["fuel", "tank", "20gal", "20 gal"],
  },
  {
    id: "fuel-tank-50gal",
    title: "Fuel Tank 50gal",
    description: "50 gallon fuel tank",
    category: "plumbing_systems",
    keywords: ["fuel", "tank", "50gal", "50 gal"],
  },
  {
    id: "water-tank-20gal",
    title: "Water Tank 20gal",
    description: "20 gallon water tank",
    category: "plumbing_systems",
    keywords: ["water", "tank", "20gal", "20 gal"],
  },
  {
    id: "water-tank-50gal",
    title: "Water Tank 50gal",
    description: "50 gallon water tank",
    category: "plumbing_systems",
    keywords: ["water", "tank", "50gal", "50 gal"],
  },
  {
    id: "water-tank-100gal",
    title: "Water Tank 100gal",
    description: "100 gallon water tank",
    category: "plumbing_systems",
    keywords: ["water", "tank", "100gal", "100 gal"],
  },
  {
    id: "marine-toilet",
    title: "Marine Toilet",
    description: "Marine head / toilet",
    category: "plumbing_systems",
    keywords: ["toilet", "head", "marine"],
  },

  // ========================================
  // Galley Equipment
  // ========================================
  {
    id: "marine-refrigerator-3cuft",
    title: "Marine Refrigerator 3cuft",
    description: "3 cubic foot marine refrigerator",
    category: "galley_equipment",
    keywords: ["refrigerator", "fridge", "3cuft", "3 cu ft"],
  },
  {
    id: "marine-refrigerator-5cuft",
    title: "Marine Refrigerator 5cuft",
    description: "5 cubic foot marine refrigerator",
    category: "galley_equipment",
    keywords: ["refrigerator", "fridge", "5cuft", "5 cu ft"],
  },
  {
    id: "marine-stove",
    title: "Marine Stove",
    description: "Marine galley stove",
    category: "galley_equipment",
    keywords: ["stove", "cooktop", "galley"],
  },
  {
    id: "marine-sink",
    title: "Marine Sink",
    description: "Marine galley sink",
    category: "galley_equipment",
    keywords: ["sink", "galley"],
  },

  // ========================================
  // Deck Hardware
  // ========================================
  {
    id: "winch-deck",
    title: "Deck Winch",
    description: "Deck winch for lines",
    category: "deck_hardware",
    keywords: ["winch", "deck"],
  },
  {
    id: "shackles",
    title: "Shackles",
    description: "Shackles (set)",
    category: "deck_hardware",
    keywords: ["shackle", "shackles"],
  },
  {
    id: "snap-shackles",
    title: "Snap Shackles",
    description: "Snap shackles (set)",
    category: "deck_hardware",
    keywords: ["snap", "shackle", "shackles"],
  },
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category?: string): ItemTemplate[] {
  if (!category) return ITEM_TEMPLATES;
  return ITEM_TEMPLATES.filter((template) => template.category === category);
}

/**
 * Search templates by keyword
 */
export function searchTemplates(query: string): ItemTemplate[] {
  const lowerQuery = query.toLowerCase();
  return ITEM_TEMPLATES.filter((template) => {
    const searchableText = `${template.title} ${template.description} ${template.keywords.join(" ")}`.toLowerCase();
    return searchableText.includes(lowerQuery);
  });
}

/**
 * Get all unique categories from templates
 */
export function getTemplateCategories(): string[] {
  const categories = new Set(ITEM_TEMPLATES.map((t) => t.category));
  return Array.from(categories).sort();
}

