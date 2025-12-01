/**
 * Weight Estimation Utilities
 *
 * Provides intelligent weight estimation using multiple methods:
 * 1. Text detection (extract weight from title/description)
 * 2. Common items database (keyword matching)
 * 3. Category-based defaults
 * 4. Weight feel estimation (from dimensions + feel)
 * 5. Validation warnings for inconsistencies
 */

export type WeightFeel =
  | "very_light"
  | "light"
  | "medium"
  | "heavy"
  | "very_heavy";

export interface WeightEstimate {
  weight: number;
  confidence: "high" | "medium" | "low";
  source: string;
}

export interface WeightRange {
  min: number;
  max: number;
  typical?: number;
}

export interface ReferenceItem {
  name: string;
  weight: number;
  dimensions: string;
  category?: string;
}

export interface ItemSpecs {
  weight: number; // kg
  dimensions: {
    length: number; // cm
    width: number; // cm
    height: number; // cm
  };
  category: string;
  source: string;
}

// Weight feel density ranges (kg/L)
export const WEIGHT_FEEL_DENSITIES: Record<
  WeightFeel,
  { min: number; max: number; typical: number }
> = {
  very_light: { min: 0.01, max: 0.1, typical: 0.05 }, // foam, fabric, air-filled
  light: { min: 0.1, max: 0.5, typical: 0.3 }, // electronics, plastic, wood
  medium: { min: 0.5, max: 1.5, typical: 1.0 }, // water, most common items
  heavy: { min: 1.5, max: 3.0, typical: 2.2 }, // metal, dense materials
  very_heavy: { min: 3.0, max: 10.0, typical: 5.0 }, // lead, very dense metals
};

// Common items database with full specs (weight, dimensions, category)
interface ItemSpec {
  weight: number; // kg
  dimensions: { length: number; width: number; height: number }; // cm
  category: string;
}

interface ItemDatabase {
  [itemType: string]: {
    [variant: string]: ItemSpec | number; // Can be full spec or just weight (for backward compat)
  } & {
    default?: ItemSpec | number;
  };
}

const COMMON_ITEMS: ItemDatabase = {
  battery: {
    // Lithium batteries - calculate from Ah
    // Typical: ~0.1kg per Ah, dimensions scale with capacity
    default: {
      weight: 20,
      dimensions: { length: 30, width: 20, height: 20 },
      category: "marine",
    },
  },
  "lithium battery": {
    default: {
      weight: 2,
      dimensions: { length: 15, width: 10, height: 5 },
      category: "electronics",
    },
  },
  "marine battery": {
    default: {
      weight: 20,
      dimensions: { length: 30, width: 20, height: 20 },
      category: "marine",
    },
  },
  anchor: {
    "5kg": { weight: 5, dimensions: { length: 30, width: 20, height: 15 }, category: "marine" },
    "5 kg": { weight: 5, dimensions: { length: 30, width: 20, height: 15 }, category: "marine" },
    "10kg": { weight: 10, dimensions: { length: 40, width: 30, height: 20 }, category: "marine" },
    "10 kg": { weight: 10, dimensions: { length: 40, width: 30, height: 20 }, category: "marine" },
    "15kg": { weight: 15, dimensions: { length: 50, width: 35, height: 25 }, category: "marine" },
    "15 kg": { weight: 15, dimensions: { length: 50, width: 35, height: 25 }, category: "marine" },
    "20kg": { weight: 20, dimensions: { length: 55, width: 40, height: 30 }, category: "marine" },
    "20 kg": { weight: 20, dimensions: { length: 55, width: 40, height: 30 }, category: "marine" },
    "25kg": { weight: 25, dimensions: { length: 60, width: 45, height: 35 }, category: "marine" },
    "25 kg": { weight: 25, dimensions: { length: 60, width: 45, height: 35 }, category: "marine" },
    default: { weight: 12, dimensions: { length: 40, width: 30, height: 10 }, category: "marine" },
  },
  sail: {
    genoa: { weight: 3, dimensions: { length: 80, width: 20, height: 20 }, category: "marine" },
    jib: { weight: 2, dimensions: { length: 70, width: 15, height: 15 }, category: "marine" },
    mainsail: { weight: 5, dimensions: { length: 100, width: 25, height: 25 }, category: "marine" },
    "main sail": { weight: 5, dimensions: { length: 100, width: 25, height: 25 }, category: "marine" },
    spinnaker: { weight: 2, dimensions: { length: 60, width: 20, height: 20 }, category: "marine" },
    default: { weight: 4, dimensions: { length: 80, width: 20, height: 20 }, category: "marine" },
  },
  chartplotter: {
    default: { weight: 1.5, dimensions: { length: 25, width: 15, height: 5 }, category: "electronics" },
  },
  "chart plotter": {
    default: { weight: 1.5, dimensions: { length: 25, width: 15, height: 5 }, category: "electronics" },
  },
  gps: {
    default: { weight: 0.5, dimensions: { length: 15, width: 10, height: 3 }, category: "electronics" },
  },
  vhf: {
    default: { weight: 1, dimensions: { length: 20, width: 10, height: 5 }, category: "electronics" },
  },
  radio: {
    default: { weight: 1, dimensions: { length: 20, width: 10, height: 5 }, category: "electronics" },
  },
  autopilot: {
    default: { weight: 3, dimensions: { length: 30, width: 20, height: 10 }, category: "electronics" },
  },
  "auto pilot": {
    default: { weight: 3, dimensions: { length: 30, width: 20, height: 10 }, category: "electronics" },
  },
  winch: {
    default: { weight: 5, dimensions: { length: 15, width: 15, height: 15 }, category: "tools" },
  },
  windlass: {
    default: { weight: 15, dimensions: { length: 30, width: 25, height: 20 }, category: "tools" },
  },
  outboard: {
    "15hp": { weight: 35, dimensions: { length: 120, width: 40, height: 40 }, category: "marine" },
    "15 hp": { weight: 35, dimensions: { length: 120, width: 40, height: 40 }, category: "marine" },
    "40hp": { weight: 75, dimensions: { length: 150, width: 50, height: 50 }, category: "marine" },
    "40 hp": { weight: 75, dimensions: { length: 150, width: 50, height: 50 }, category: "marine" },
    "60hp": { weight: 100, dimensions: { length: 180, width: 60, height: 60 }, category: "marine" },
    "60 hp": { weight: 100, dimensions: { length: 180, width: 60, height: 60 }, category: "marine" },
    default: { weight: 50, dimensions: { length: 130, width: 45, height: 45 }, category: "marine" },
  },
  "outboard motor": {
    "15hp": { weight: 35, dimensions: { length: 120, width: 40, height: 40 }, category: "marine" },
    "15 hp": { weight: 35, dimensions: { length: 120, width: 40, height: 40 }, category: "marine" },
    "40hp": { weight: 75, dimensions: { length: 150, width: 50, height: 50 }, category: "marine" },
    "40 hp": { weight: 75, dimensions: { length: 150, width: 50, height: 50 }, category: "marine" },
    "60hp": { weight: 100, dimensions: { length: 180, width: 60, height: 60 }, category: "marine" },
    "60 hp": { weight: 100, dimensions: { length: 180, width: 60, height: 60 }, category: "marine" },
    default: { weight: 50, dimensions: { length: 130, width: 45, height: 45 }, category: "marine" },
  },
  impeller: {
    default: { weight: 0.5, dimensions: { length: 10, width: 10, height: 5 }, category: "marine" },
  },
  "lower unit": {
    default: { weight: 25, dimensions: { length: 60, width: 40, height: 40 }, category: "marine" },
  },
  rigging: {
    default: { weight: 10, dimensions: { length: 200, width: 20, height: 20 }, category: "marine" },
  },
  "standing rigging": {
    default: { weight: 15, dimensions: { length: 200, width: 25, height: 25 }, category: "marine" },
  },
  mainsail: {
    default: { weight: 5, dimensions: { length: 100, width: 25, height: 25 }, category: "marine" },
  },
  laptop: {
    default: { weight: 2, dimensions: { length: 35, width: 25, height: 2 }, category: "electronics" },
  },
  drone: {
    default: { weight: 1, dimensions: { length: 30, width: 30, height: 10 }, category: "electronics" },
  },
  "car battery": {
    default: { weight: 15, dimensions: { length: 30, width: 20, height: 20 }, category: "automotive" },
  },
  "deep cycle": {
    default: { weight: 25, dimensions: { length: 35, width: 25, height: 25 }, category: "marine" },
  },
  "agm battery": {
    default: { weight: 22, dimensions: { length: 32, width: 22, height: 22 }, category: "marine" },
  },
  "gel battery": {
    default: { weight: 20, dimensions: { length: 30, width: 20, height: 20 }, category: "marine" },
  },
  "water pump": {
    default: { weight: 2, dimensions: { length: 15, width: 15, height: 15 }, category: "marine" },
  },
  "fuel filter": {
    default: { weight: 0.5, dimensions: { length: 10, width: 10, height: 10 }, category: "marine" },
  },
  "oil filter": {
    default: { weight: 0.5, dimensions: { length: 10, width: 10, height: 10 }, category: "automotive" },
  },
  "spark plug": {
    default: { weight: 0.1, dimensions: { length: 8, width: 2, height: 2 }, category: "automotive" },
  },
  "spark plugs": {
    default: { weight: 0.5, dimensions: { length: 10, width: 5, height: 5 }, category: "automotive" },
  },
  "air filter": {
    default: { weight: 1, dimensions: { length: 20, width: 20, height: 5 }, category: "automotive" },
  },
  "starter motor": {
    default: { weight: 8, dimensions: { length: 20, width: 15, height: 15 }, category: "automotive" },
  },
  "alternator": {
    default: { weight: 6, dimensions: { length: 18, width: 15, height: 15 }, category: "automotive" },
  },
  "water pump automotive": {
    default: { weight: 3, dimensions: { length: 15, width: 15, height: 15 }, category: "automotive" },
  },
  "radiator": {
    default: { weight: 12, dimensions: { length: 60, width: 40, height: 5 }, category: "automotive" },
  },
  "transmission": {
    default: { weight: 50, dimensions: { length: 50, width: 40, height: 40 }, category: "automotive" },
  },
  "engine block": {
    default: { weight: 100, dimensions: { length: 60, width: 50, height: 50 }, category: "automotive" },
  },
  "cylinder head": {
    default: { weight: 15, dimensions: { length: 40, width: 30, height: 10 }, category: "automotive" },
  },
  "piston": {
    default: { weight: 0.5, dimensions: { length: 8, width: 8, height: 8 }, category: "automotive" },
  },
  "pistons": {
    default: { weight: 2, dimensions: { length: 10, width: 10, height: 10 }, category: "automotive" },
  },
  "connecting rod": {
    default: { weight: 0.8, dimensions: { length: 15, width: 3, height: 3 }, category: "automotive" },
  },
  "connecting rods": {
    default: { weight: 3, dimensions: { length: 20, width: 5, height: 5 }, category: "automotive" },
  },
  "crankshaft": {
    default: { weight: 20, dimensions: { length: 50, width: 20, height: 20 }, category: "automotive" },
  },
  "camshaft": {
    default: { weight: 5, dimensions: { length: 40, width: 5, height: 5 }, category: "automotive" },
  },
  "timing belt": {
    default: { weight: 0.5, dimensions: { length: 100, width: 3, height: 1 }, category: "automotive" },
  },
  "timing chain": {
    default: { weight: 1, dimensions: { length: 100, width: 5, height: 2 }, category: "automotive" },
  },
  "serpentine belt": {
    default: { weight: 0.3, dimensions: { length: 80, width: 2, height: 1 }, category: "automotive" },
  },
  "drive belt": {
    default: { weight: 0.3, dimensions: { length: 80, width: 2, height: 1 }, category: "automotive" },
  },
  "fan belt": {
    default: { weight: 0.2, dimensions: { length: 70, width: 2, height: 1 }, category: "automotive" },
  },
  "brake pad": {
    default: { weight: 0.5, dimensions: { length: 15, width: 10, height: 2 }, category: "automotive" },
  },
  "brake pads": {
    default: { weight: 2, dimensions: { length: 20, width: 15, height: 5 }, category: "automotive" },
  },
  "brake rotor": {
    default: { weight: 8, dimensions: { length: 30, width: 30, height: 3 }, category: "automotive" },
  },
  "brake rotors": {
    default: { weight: 16, dimensions: { length: 35, width: 35, height: 5 }, category: "automotive" },
  },
  "brake disc": {
    default: { weight: 8, dimensions: { length: 30, width: 30, height: 3 }, category: "automotive" },
  },
  "brake discs": {
    default: { weight: 16, dimensions: { length: 35, width: 35, height: 5 }, category: "automotive" },
  },
  "brake caliper": {
    default: { weight: 3, dimensions: { length: 15, width: 10, height: 8 }, category: "automotive" },
  },
  "brake calipers": {
    default: { weight: 6, dimensions: { length: 20, width: 15, height: 10 }, category: "automotive" },
  },
  "shock absorber": {
    default: { weight: 5, dimensions: { length: 40, width: 8, height: 8 }, category: "automotive" },
  },
  "shock absorbers": {
    default: { weight: 10, dimensions: { length: 45, width: 10, height: 10 }, category: "automotive" },
  },
  "struts": {
    default: { weight: 8, dimensions: { length: 50, width: 10, height: 10 }, category: "automotive" },
  },
  "coil spring": {
    default: { weight: 3, dimensions: { length: 30, width: 15, height: 15 }, category: "automotive" },
  },
  "coil springs": {
    default: { weight: 6, dimensions: { length: 35, width: 18, height: 18 }, category: "automotive" },
  },
  "leaf spring": {
    default: { weight: 15, dimensions: { length: 100, width: 8, height: 3 }, category: "automotive" },
  },
  "leaf springs": {
    default: { weight: 30, dimensions: { length: 120, width: 10, height: 5 }, category: "automotive" },
  },
  "wheel bearing": {
    default: { weight: 0.5, dimensions: { length: 8, width: 8, height: 3 }, category: "automotive" },
  },
  "wheel bearings": {
    default: { weight: 2, dimensions: { length: 10, width: 10, height: 5 }, category: "automotive" },
  },
  "cv joint": {
    default: { weight: 2, dimensions: { length: 15, width: 10, height: 10 }, category: "automotive" },
  },
  "cv joints": {
    default: { weight: 4, dimensions: { length: 18, width: 12, height: 12 }, category: "automotive" },
  },
  "axle": {
    default: { weight: 25, dimensions: { length: 120, width: 10, height: 10 }, category: "automotive" },
  },
  "axles": {
    default: { weight: 50, dimensions: { length: 130, width: 12, height: 12 }, category: "automotive" },
  },
  "differential": {
    default: { weight: 30, dimensions: { length: 40, width: 30, height: 25 }, category: "automotive" },
  },
  "drive shaft": {
    default: { weight: 15, dimensions: { length: 100, width: 8, height: 8 }, category: "automotive" },
  },
  "drive shafts": {
    default: { weight: 30, dimensions: { length: 110, width: 10, height: 10 }, category: "automotive" },
  },
  "exhaust manifold": {
    default: { weight: 8, dimensions: { length: 50, width: 20, height: 15 }, category: "automotive" },
  },
  "intake manifold": {
    default: { weight: 5, dimensions: { length: 40, width: 25, height: 10 }, category: "automotive" },
  },
  "turbocharger": {
    default: { weight: 12, dimensions: { length: 25, width: 20, height: 20 }, category: "automotive" },
  },
  "supercharger": {
    default: { weight: 15, dimensions: { length: 30, width: 25, height: 25 }, category: "automotive" },
  },
  "intercooler": {
    default: { weight: 8, dimensions: { length: 50, width: 30, height: 10 }, category: "automotive" },
  },
  "throttle body": {
    default: { weight: 2, dimensions: { length: 15, width: 15, height: 8 }, category: "automotive" },
  },
  "fuel injector": {
    default: { weight: 0.2, dimensions: { length: 8, width: 3, height: 3 }, category: "automotive" },
  },
  "fuel injectors": {
    default: { weight: 1, dimensions: { length: 12, width: 6, height: 6 }, category: "automotive" },
  },
  "fuel pump": {
    default: { weight: 1, dimensions: { length: 12, width: 8, height: 8 }, category: "automotive" },
  },
  "gas tank": {
    default: { weight: 20, dimensions: { length: 80, width: 50, height: 30 }, category: "automotive" },
  },
  "muffler": {
    default: { weight: 10, dimensions: { length: 60, width: 20, height: 20 }, category: "automotive" },
  },
  "catalytic converter": {
    default: { weight: 8, dimensions: { length: 40, width: 15, height: 15 }, category: "automotive" },
  },
  "oxygen sensor": {
    default: { weight: 0.1, dimensions: { length: 10, width: 2, height: 2 }, category: "automotive" },
  },
  "oxygen sensors": {
    default: { weight: 0.4, dimensions: { length: 12, width: 4, height: 4 }, category: "automotive" },
  },
  "mass airflow sensor": {
    default: { weight: 0.3, dimensions: { length: 8, width: 5, height: 5 }, category: "automotive" },
  },
  "maf sensor": {
    default: { weight: 0.3, dimensions: { length: 8, width: 5, height: 5 }, category: "automotive" },
  },
  "map sensor": {
    default: { weight: 0.2, dimensions: { length: 6, width: 4, height: 4 }, category: "automotive" },
  },
  "iac valve": {
    default: { weight: 0.3, dimensions: { length: 8, width: 5, height: 5 }, category: "automotive" },
  },
  "idle air control": {
    default: { weight: 0.3, dimensions: { length: 8, width: 5, height: 5 }, category: "automotive" },
  },
  "egr valve": {
    default: { weight: 0.5, dimensions: { length: 10, width: 6, height: 6 }, category: "automotive" },
  },
  "pcv valve": {
    default: { weight: 0.1, dimensions: { length: 5, width: 2, height: 2 }, category: "automotive" },
  },
  "thermostat": {
    default: { weight: 0.2, dimensions: { length: 6, width: 6, height: 3 }, category: "automotive" },
  },
  "water temperature sensor": {
    default: { weight: 0.1, dimensions: { length: 5, width: 2, height: 2 }, category: "automotive" },
  },
  "coolant temperature sensor": {
    default: { weight: 0.1, dimensions: { length: 5, width: 2, height: 2 }, category: "automotive" },
  },
  "oil pressure sensor": {
    default: { weight: 0.1, dimensions: { length: 5, width: 2, height: 2 }, category: "automotive" },
  },
  "knock sensor": {
    default: { weight: 0.2, dimensions: { length: 6, width: 4, height: 4 }, category: "automotive" },
  },
  "crank position sensor": {
    default: { weight: 0.2, dimensions: { length: 6, width: 4, height: 4 }, category: "automotive" },
  },
  "cam position sensor": {
    default: { weight: 0.2, dimensions: { length: 6, width: 4, height: 4 }, category: "automotive" },
  },
  "wheel speed sensor": {
    default: { weight: 0.1, dimensions: { length: 5, width: 2, height: 2 }, category: "automotive" },
  },
  "abs sensor": {
    default: { weight: 0.1, dimensions: { length: 5, width: 2, height: 2 }, category: "automotive" },
  },
  "wheel": {
    default: { weight: 12, dimensions: { length: 50, width: 50, height: 20 }, category: "automotive" },
  },
  "wheels": {
    default: { weight: 48, dimensions: { length: 55, width: 55, height: 22 }, category: "automotive" },
  },
  "rim": {
    default: { weight: 8, dimensions: { length: 45, width: 45, height: 15 }, category: "automotive" },
  },
  "rims": {
    default: { weight: 32, dimensions: { length: 50, width: 50, height: 18 }, category: "automotive" },
  },
  "tire": {
    default: { weight: 10, dimensions: { length: 70, width: 70, height: 25 }, category: "automotive" },
  },
  "tires": {
    default: { weight: 40, dimensions: { length: 75, width: 75, height: 28 }, category: "automotive" },
  },
  "wheel and tire": {
    default: { weight: 22, dimensions: { length: 70, width: 70, height: 30 }, category: "automotive" },
  },
  "wheels and tires": {
    default: { weight: 88, dimensions: { length: 75, width: 75, height: 32 }, category: "automotive" },
  },
  // Marine/boat parts with predictable specs
  propeller: {
    "10inch": { weight: 2, dimensions: { length: 25, width: 25, height: 8 }, category: "marine" },
    "10 inch": { weight: 2, dimensions: { length: 25, width: 25, height: 8 }, category: "marine" },
    "12inch": { weight: 3, dimensions: { length: 30, width: 30, height: 10 }, category: "marine" },
    "12 inch": { weight: 3, dimensions: { length: 30, width: 30, height: 10 }, category: "marine" },
    "14inch": { weight: 4, dimensions: { length: 35, width: 35, height: 12 }, category: "marine" },
    "14 inch": { weight: 4, dimensions: { length: 35, width: 35, height: 12 }, category: "marine" },
    "16inch": { weight: 5, dimensions: { length: 40, width: 40, height: 15 }, category: "marine" },
    "16 inch": { weight: 5, dimensions: { length: 40, width: 40, height: 15 }, category: "marine" },
    default: { weight: 3, dimensions: { length: 30, width: 30, height: 10 }, category: "marine" },
  },
  "propeller blade": {
    default: { weight: 2, dimensions: { length: 35, width: 35, height: 8 }, category: "marine" },
  },
  "prop shaft": {
    default: { weight: 5, dimensions: { length: 100, width: 10, height: 10 }, category: "marine" },
  },
  "propeller shaft": {
    default: { weight: 5, dimensions: { length: 100, width: 10, height: 10 }, category: "marine" },
  },
  "shaft seal": {
    default: { weight: 0.5, dimensions: { length: 10, width: 10, height: 5 }, category: "marine" },
  },
  "cutless bearing": {
    default: { weight: 0.5, dimensions: { length: 15, width: 8, height: 8 }, category: "marine" },
  },
  "strut": {
    default: { weight: 3, dimensions: { length: 30, width: 8, height: 8 }, category: "marine" },
  },
  rudder: {
    default: { weight: 15, dimensions: { length: 80, width: 40, height: 5 }, category: "marine" },
  },
  "rudder stock": {
    default: { weight: 8, dimensions: { length: 100, width: 8, height: 8 }, category: "marine" },
  },
  "rudder bearing": {
    default: { weight: 1, dimensions: { length: 15, width: 10, height: 10 }, category: "marine" },
  },
  keel: {
    default: { weight: 200, dimensions: { length: 300, width: 50, height: 30 }, category: "marine" },
  },
  "keel bolt": {
    default: { weight: 2, dimensions: { length: 30, width: 3, height: 3 }, category: "marine" },
  },
  "keel bolts": {
    default: { weight: 10, dimensions: { length: 35, width: 5, height: 5 }, category: "marine" },
  },
  mast: {
    "30ft": { weight: 25, dimensions: { length: 900, width: 15, height: 15 }, category: "marine" },
    "30 ft": { weight: 25, dimensions: { length: 900, width: 15, height: 15 }, category: "marine" },
    "40ft": { weight: 35, dimensions: { length: 1200, width: 18, height: 18 }, category: "marine" },
    "40 ft": { weight: 35, dimensions: { length: 1200, width: 18, height: 18 }, category: "marine" },
    "50ft": { weight: 50, dimensions: { length: 1500, width: 20, height: 20 }, category: "marine" },
    "50 ft": { weight: 50, dimensions: { length: 1500, width: 20, height: 20 }, category: "marine" },
    default: { weight: 30, dimensions: { length: 1000, width: 16, height: 16 }, category: "marine" },
  },
  boom: {
    default: { weight: 8, dimensions: { length: 300, width: 12, height: 12 }, category: "marine" },
  },
  "boom vang": {
    default: { weight: 2, dimensions: { length: 50, width: 5, height: 5 }, category: "marine" },
  },
  "gooseneck": {
    default: { weight: 3, dimensions: { length: 20, width: 15, height: 15 }, category: "marine" },
  },
  "mast step": {
    default: { weight: 5, dimensions: { length: 30, width: 20, height: 10 }, category: "marine" },
  },
  "chainplate": {
    default: { weight: 2, dimensions: { length: 30, width: 5, height: 1 }, category: "marine" },
  },
  "chainplates": {
    default: { weight: 8, dimensions: { length: 35, width: 6, height: 2 }, category: "marine" },
  },
  "turnbuckle": {
    default: { weight: 0.5, dimensions: { length: 15, width: 3, height: 3 }, category: "marine" },
  },
  "turnbuckles": {
    default: { weight: 2, dimensions: { length: 18, width: 4, height: 4 }, category: "marine" },
  },
  "shackle": {
    default: { weight: 0.2, dimensions: { length: 8, width: 5, height: 3 }, category: "marine" },
  },
  "shackles": {
    default: { weight: 1, dimensions: { length: 10, width: 6, height: 4 }, category: "marine" },
  },
  "snap shackle": {
    default: { weight: 0.3, dimensions: { length: 10, width: 6, height: 4 }, category: "marine" },
  },
  "snap shackles": {
    default: { weight: 1.5, dimensions: { length: 12, width: 7, height: 5 }, category: "marine" },
  },
  "block": {
    default: { weight: 0.5, dimensions: { length: 10, width: 8, height: 8 }, category: "marine" },
  },
  "blocks": {
    default: { weight: 2, dimensions: { length: 12, width: 10, height: 10 }, category: "marine" },
  },
  "pulley": {
    default: { weight: 0.5, dimensions: { length: 10, width: 8, height: 8 }, category: "marine" },
  },
  "pulleys": {
    default: { weight: 2, dimensions: { length: 12, width: 10, height: 10 }, category: "marine" },
  },
  "rope": {
    "50ft": { weight: 2, dimensions: { length: 1500, width: 5, height: 5 }, category: "marine" },
    "50 ft": { weight: 2, dimensions: { length: 1500, width: 5, height: 5 }, category: "marine" },
    "100ft": { weight: 4, dimensions: { length: 3000, width: 5, height: 5 }, category: "marine" },
    "100 ft": { weight: 4, dimensions: { length: 3000, width: 5, height: 5 }, category: "marine" },
    "200ft": { weight: 8, dimensions: { length: 6000, width: 5, height: 5 }, category: "marine" },
    "200 ft": { weight: 8, dimensions: { length: 6000, width: 5, height: 5 }, category: "marine" },
    default: { weight: 3, dimensions: { length: 2000, width: 5, height: 5 }, category: "marine" },
  },
  "line": {
    "50ft": { weight: 2, dimensions: { length: 1500, width: 5, height: 5 }, category: "marine" },
    "50 ft": { weight: 2, dimensions: { length: 1500, width: 5, height: 5 }, category: "marine" },
    "100ft": { weight: 4, dimensions: { length: 3000, width: 5, height: 5 }, category: "marine" },
    "100 ft": { weight: 4, dimensions: { length: 3000, width: 5, height: 5 }, category: "marine" },
    default: { weight: 3, dimensions: { length: 2000, width: 5, height: 5 }, category: "marine" },
  },
  "anchor chain": {
    "50ft": { weight: 25, dimensions: { length: 1500, width: 10, height: 10 }, category: "marine" },
    "50 ft": { weight: 25, dimensions: { length: 1500, width: 10, height: 10 }, category: "marine" },
    "100ft": { weight: 50, dimensions: { length: 3000, width: 10, height: 10 }, category: "marine" },
    "100 ft": { weight: 50, dimensions: { length: 3000, width: 10, height: 10 }, category: "marine" },
    "200ft": { weight: 100, dimensions: { length: 6000, width: 10, height: 10 }, category: "marine" },
    "200 ft": { weight: 100, dimensions: { length: 6000, width: 10, height: 10 }, category: "marine" },
    default: { weight: 40, dimensions: { length: 2000, width: 10, height: 10 }, category: "marine" },
  },
  "chain": {
    "50ft": { weight: 25, dimensions: { length: 1500, width: 10, height: 10 }, category: "marine" },
    "50 ft": { weight: 25, dimensions: { length: 1500, width: 10, height: 10 }, category: "marine" },
    "100ft": { weight: 50, dimensions: { length: 3000, width: 10, height: 10 }, category: "marine" },
    "100 ft": { weight: 50, dimensions: { length: 3000, width: 10, height: 10 }, category: "marine" },
    default: { weight: 40, dimensions: { length: 2000, width: 10, height: 10 }, category: "marine" },
  },
  "anchor rode": {
    default: { weight: 5, dimensions: { length: 2000, width: 8, height: 8 }, category: "marine" },
  },
  "rode": {
    default: { weight: 5, dimensions: { length: 2000, width: 8, height: 8 }, category: "marine" },
  },
  fender: {
    "4inch": { weight: 0.5, dimensions: { length: 30, width: 12, height: 12 }, category: "marine" },
    "4 inch": { weight: 0.5, dimensions: { length: 30, width: 12, height: 12 }, category: "marine" },
    "6inch": { weight: 1, dimensions: { length: 40, width: 18, height: 18 }, category: "marine" },
    "6 inch": { weight: 1, dimensions: { length: 40, width: 18, height: 18 }, category: "marine" },
    "8inch": { weight: 1.5, dimensions: { length: 50, width: 24, height: 24 }, category: "marine" },
    "8 inch": { weight: 1.5, dimensions: { length: 50, width: 24, height: 24 }, category: "marine" },
    default: { weight: 1, dimensions: { length: 40, width: 18, height: 18 }, category: "marine" },
  },
  "dock line": {
    "25ft": { weight: 1, dimensions: { length: 750, width: 3, height: 3 }, category: "marine" },
    "25 ft": { weight: 1, dimensions: { length: 750, width: 3, height: 3 }, category: "marine" },
    "50ft": { weight: 2, dimensions: { length: 1500, width: 3, height: 3 }, category: "marine" },
    "50 ft": { weight: 2, dimensions: { length: 1500, width: 3, height: 3 }, category: "marine" },
    default: { weight: 1.5, dimensions: { length: 1000, width: 3, height: 3 }, category: "marine" },
  },
  "dock lines": {
    default: { weight: 4, dimensions: { length: 1200, width: 4, height: 4 }, category: "marine" },
  },
  "fuel tank": {
    "10gal": { weight: 5, dimensions: { length: 40, width: 30, height: 30 }, category: "marine" },
    "10 gal": { weight: 5, dimensions: { length: 40, width: 30, height: 30 }, category: "marine" },
    "20gal": { weight: 8, dimensions: { length: 50, width: 40, height: 40 }, category: "marine" },
    "20 gal": { weight: 8, dimensions: { length: 50, width: 40, height: 40 }, category: "marine" },
    "50gal": { weight: 15, dimensions: { length: 70, width: 50, height: 50 }, category: "marine" },
    "50 gal": { weight: 15, dimensions: { length: 70, width: 50, height: 50 }, category: "marine" },
    default: { weight: 10, dimensions: { length: 60, width: 40, height: 40 }, category: "marine" },
  },
  "water tank": {
    "20gal": { weight: 8, dimensions: { length: 50, width: 40, height: 40 }, category: "marine" },
    "20 gal": { weight: 8, dimensions: { length: 50, width: 40, height: 40 }, category: "marine" },
    "50gal": { weight: 15, dimensions: { length: 70, width: 50, height: 50 }, category: "marine" },
    "50 gal": { weight: 15, dimensions: { length: 70, width: 50, height: 50 }, category: "marine" },
    "100gal": { weight: 25, dimensions: { length: 100, width: 60, height: 60 }, category: "marine" },
    "100 gal": { weight: 25, dimensions: { length: 100, width: 60, height: 60 }, category: "marine" },
    default: { weight: 15, dimensions: { length: 70, width: 50, height: 50 }, category: "marine" },
  },
  "bilge pump": {
    "500gph": { weight: 1, dimensions: { length: 15, width: 10, height: 10 }, category: "marine" },
    "500 gph": { weight: 1, dimensions: { length: 15, width: 10, height: 10 }, category: "marine" },
    "1000gph": { weight: 1.5, dimensions: { length: 18, width: 12, height: 12 }, category: "marine" },
    "1000 gph": { weight: 1.5, dimensions: { length: 18, width: 12, height: 12 }, category: "marine" },
    "2000gph": { weight: 2, dimensions: { length: 20, width: 15, height: 15 }, category: "marine" },
    "2000 gph": { weight: 2, dimensions: { length: 20, width: 15, height: 15 }, category: "marine" },
    default: { weight: 1.5, dimensions: { length: 18, width: 12, height: 12 }, category: "marine" },
  },
  "solar panel": {
    "100w": { weight: 8, dimensions: { length: 100, width: 70, height: 3 }, category: "electronics" },
    "100 w": { weight: 8, dimensions: { length: 100, width: 70, height: 3 }, category: "electronics" },
    "200w": { weight: 15, dimensions: { length: 150, width: 70, height: 3 }, category: "electronics" },
    "200 w": { weight: 15, dimensions: { length: 150, width: 70, height: 3 }, category: "electronics" },
    "300w": { weight: 22, dimensions: { length: 200, width: 100, height: 3 }, category: "electronics" },
    "300 w": { weight: 22, dimensions: { length: 200, width: 100, height: 3 }, category: "electronics" },
    default: { weight: 15, dimensions: { length: 150, width: 70, height: 3 }, category: "electronics" },
  },
  "wind generator": {
    "400w": { weight: 8, dimensions: { length: 50, width: 50, height: 30 }, category: "electronics" },
    "400 w": { weight: 8, dimensions: { length: 50, width: 50, height: 30 }, category: "electronics" },
    "600w": { weight: 12, dimensions: { length: 60, width: 60, height: 35 }, category: "electronics" },
    "600 w": { weight: 12, dimensions: { length: 60, width: 60, height: 35 }, category: "electronics" },
    default: { weight: 10, dimensions: { length: 55, width: 55, height: 32 }, category: "electronics" },
  },
  inverter: {
    "1000w": { weight: 3, dimensions: { length: 25, width: 15, height: 10 }, category: "electronics" },
    "1000 w": { weight: 3, dimensions: { length: 25, width: 15, height: 10 }, category: "electronics" },
    "2000w": { weight: 5, dimensions: { length: 30, width: 20, height: 12 }, category: "electronics" },
    "2000 w": { weight: 5, dimensions: { length: 30, width: 20, height: 12 }, category: "electronics" },
    "3000w": { weight: 8, dimensions: { length: 35, width: 25, height: 15 }, category: "electronics" },
    "3000 w": { weight: 8, dimensions: { length: 35, width: 25, height: 15 }, category: "electronics" },
    default: { weight: 5, dimensions: { length: 30, width: 20, height: 12 }, category: "electronics" },
  },
  "battery charger": {
    "10amp": { weight: 1, dimensions: { length: 15, width: 10, height: 5 }, category: "electronics" },
    "10 amp": { weight: 1, dimensions: { length: 15, width: 10, height: 5 }, category: "electronics" },
    "20amp": { weight: 2, dimensions: { length: 20, width: 15, height: 8 }, category: "electronics" },
    "20 amp": { weight: 2, dimensions: { length: 20, width: 15, height: 8 }, category: "electronics" },
    "40amp": { weight: 3, dimensions: { length: 25, width: 18, height: 10 }, category: "electronics" },
    "40 amp": { weight: 3, dimensions: { length: 25, width: 18, height: 10 }, category: "electronics" },
    default: { weight: 2, dimensions: { length: 20, width: 15, height: 8 }, category: "electronics" },
  },
  "shore power": {
    "30amp": { weight: 2, dimensions: { length: 1500, width: 3, height: 3 }, category: "electronics" },
    "30 amp": { weight: 2, dimensions: { length: 1500, width: 3, height: 3 }, category: "electronics" },
    "50amp": { weight: 3, dimensions: { length: 1500, width: 4, height: 4 }, category: "electronics" },
    "50 amp": { weight: 3, dimensions: { length: 1500, width: 4, height: 4 }, category: "electronics" },
    default: { weight: 2.5, dimensions: { length: 1500, width: 3.5, height: 3.5 }, category: "electronics" },
  },
  "shore power cord": {
    "25ft": { weight: 2, dimensions: { length: 750, width: 3, height: 3 }, category: "electronics" },
    "25 ft": { weight: 2, dimensions: { length: 750, width: 3, height: 3 }, category: "electronics" },
    "50ft": { weight: 4, dimensions: { length: 1500, width: 3, height: 3 }, category: "electronics" },
    "50 ft": { weight: 4, dimensions: { length: 1500, width: 3, height: 3 }, category: "electronics" },
    default: { weight: 3, dimensions: { length: 1000, width: 3, height: 3 }, category: "electronics" },
  },
  "marine toilet": {
    default: { weight: 8, dimensions: { length: 40, width: 35, height: 40 }, category: "marine" },
  },
  "head": {
    default: { weight: 8, dimensions: { length: 40, width: 35, height: 40 }, category: "marine" },
  },
  "marine sink": {
    default: { weight: 3, dimensions: { length: 40, width: 30, height: 15 }, category: "marine" },
  },
  "marine stove": {
    default: { weight: 12, dimensions: { length: 50, width: 40, height: 20 }, category: "marine" },
  },
  "marine refrigerator": {
    "3cuft": { weight: 25, dimensions: { length: 60, width: 50, height: 50 }, category: "marine" },
    "3 cu ft": { weight: 25, dimensions: { length: 60, width: 50, height: 50 }, category: "marine" },
    "5cuft": { weight: 35, dimensions: { length: 70, width: 60, height: 60 }, category: "marine" },
    "5 cu ft": { weight: 35, dimensions: { length: 70, width: 60, height: 60 }, category: "marine" },
    default: { weight: 30, dimensions: { length: 65, width: 55, height: 55 }, category: "marine" },
  },
  "watermaker": {
    "6gph": { weight: 15, dimensions: { length: 40, width: 30, height: 30 }, category: "marine" },
    "6 gph": { weight: 15, dimensions: { length: 40, width: 30, height: 30 }, category: "marine" },
    "12gph": { weight: 25, dimensions: { length: 50, width: 40, height: 40 }, category: "marine" },
    "12 gph": { weight: 25, dimensions: { length: 50, width: 40, height: 40 }, category: "marine" },
    default: { weight: 20, dimensions: { length: 45, width: 35, height: 35 }, category: "marine" },
  },
  "desalination unit": {
    default: { weight: 20, dimensions: { length: 45, width: 35, height: 35 }, category: "marine" },
  },
  "life raft": {
    "4person": { weight: 25, dimensions: { length: 80, width: 60, height: 40 }, category: "marine" },
    "4 person": { weight: 25, dimensions: { length: 80, width: 60, height: 40 }, category: "marine" },
    "6person": { weight: 35, dimensions: { length: 100, width: 70, height: 45 }, category: "marine" },
    "6 person": { weight: 35, dimensions: { length: 100, width: 70, height: 45 }, category: "marine" },
    default: { weight: 30, dimensions: { length: 90, width: 65, height: 42 }, category: "marine" },
  },
  "life jacket": {
    default: { weight: 1, dimensions: { length: 40, width: 30, height: 10 }, category: "marine" },
  },
  "life jackets": {
    default: { weight: 4, dimensions: { length: 45, width: 35, height: 12 }, category: "marine" },
  },
  "pfd": {
    default: { weight: 1, dimensions: { length: 40, width: 30, height: 10 }, category: "marine" },
  },
  "fire extinguisher": {
    "2lb": { weight: 3, dimensions: { length: 25, width: 10, height: 10 }, category: "marine" },
    "2 lb": { weight: 3, dimensions: { length: 25, width: 10, height: 10 }, category: "marine" },
    "5lb": { weight: 6, dimensions: { length: 35, width: 15, height: 15 }, category: "marine" },
    "5 lb": { weight: 6, dimensions: { length: 35, width: 15, height: 15 }, category: "marine" },
    default: { weight: 4.5, dimensions: { length: 30, width: 12, height: 12 }, category: "marine" },
  },
  "navigation light": {
    default: { weight: 0.5, dimensions: { length: 15, width: 8, height: 8 }, category: "electronics" },
  },
  "navigation lights": {
    default: { weight: 2, dimensions: { length: 18, width: 10, height: 10 }, category: "electronics" },
  },
  "marine horn": {
    default: { weight: 1, dimensions: { length: 20, width: 10, height: 10 }, category: "electronics" },
  },
  "compass": {
    default: { weight: 0.5, dimensions: { length: 12, width: 12, height: 5 }, category: "electronics" },
  },
  "depth sounder": {
    default: { weight: 1, dimensions: { length: 20, width: 15, height: 5 }, category: "electronics" },
  },
  "fish finder": {
    default: { weight: 1, dimensions: { length: 20, width: 15, height: 5 }, category: "electronics" },
  },
  "radar": {
    "18inch": { weight: 8, dimensions: { length: 50, width: 50, height: 15 }, category: "electronics" },
    "18 inch": { weight: 8, dimensions: { length: 50, width: 50, height: 15 }, category: "electronics" },
    "24inch": { weight: 12, dimensions: { length: 65, width: 65, height: 20 }, category: "electronics" },
    "24 inch": { weight: 12, dimensions: { length: 65, width: 65, height: 20 }, category: "electronics" },
    default: { weight: 10, dimensions: { length: 57, width: 57, height: 17 }, category: "electronics" },
  },
  "ais transponder": {
    default: { weight: 1, dimensions: { length: 15, width: 10, height: 5 }, category: "electronics" },
  },
  "ais": {
    default: { weight: 1, dimensions: { length: 15, width: 10, height: 5 }, category: "electronics" },
  },
  "epirb": {
    default: { weight: 0.5, dimensions: { length: 20, width: 10, height: 10 }, category: "electronics" },
  },
  "plb": {
    default: { weight: 0.3, dimensions: { length: 12, width: 6, height: 6 }, category: "electronics" },
  },
  "ssb radio": {
    default: { weight: 3, dimensions: { length: 25, width: 20, height: 10 }, category: "electronics" },
  },
  "satellite phone": {
    default: { weight: 0.5, dimensions: { length: 15, width: 8, height: 3 }, category: "electronics" },
  },
  "sat phone": {
    default: { weight: 0.5, dimensions: { length: 15, width: 8, height: 3 }, category: "electronics" },
  },
};

// Category-based default weights
const CATEGORY_DEFAULTS: Record<string, WeightRange> = {
  electronics: { min: 0.5, max: 5, typical: 1 },
  marine: { min: 5, max: 30, typical: 15 },
  food: { min: 0.5, max: 10, typical: 2 },
  clothing: { min: 0.1, max: 3, typical: 0.5 },
  tools: { min: 1, max: 20, typical: 3 },
  medical: { min: 0.5, max: 5, typical: 1.5 },
  automotive: { min: 5, max: 50, typical: 15 },
  sports: { min: 1, max: 15, typical: 5 },
  books: { min: 0.5, max: 3, typical: 1 },
};

// Reference items for comparison
export const REFERENCE_ITEMS: ReferenceItem[] = [
  {
    name: "Laptop",
    weight: 2,
    dimensions: "35×25×2 cm",
    category: "electronics",
  },
  {
    name: "Car Battery",
    weight: 15,
    dimensions: "30×20×20 cm",
    category: "automotive",
  },
  {
    name: "Suitcase (empty)",
    weight: 3,
    dimensions: "70×45×25 cm",
    category: "clothing",
  },
  {
    name: "Suitcase (packed)",
    weight: 20,
    dimensions: "70×45×25 cm",
    category: "clothing",
  },
  {
    name: "Marine Battery 100Ah",
    weight: 12,
    dimensions: "30×20×20 cm",
    category: "marine",
  },
  {
    name: "Marine Battery 200Ah",
    weight: 24,
    dimensions: "35×25×25 cm",
    category: "marine",
  },
  {
    name: "Anchor (typical)",
    weight: 12,
    dimensions: "40×30×10 cm",
    category: "marine",
  },
  {
    name: "Sail (Genoa)",
    weight: 3,
    dimensions: "Rolls up small",
    category: "marine",
  },
  {
    name: "Sail (Mainsail)",
    weight: 5,
    dimensions: "Rolls up small",
    category: "marine",
  },
  {
    name: "Chartplotter",
    weight: 1.5,
    dimensions: "25×15×5 cm",
    category: "electronics",
  },
  {
    name: "VHF Radio",
    weight: 1,
    dimensions: "20×10×5 cm",
    category: "electronics",
  },
  { name: "Winch", weight: 5, dimensions: "15×15×15 cm", category: "tools" },
  {
    name: "Windlass",
    weight: 15,
    dimensions: "30×25×20 cm",
    category: "tools",
  },
];

/**
 * Detect and auto-fill item specs (weight, dimensions, category) from text
 * Returns full item specifications if detected
 */
/**
 * Extract numeric specs from text (Ah, diameter, wattage, gallons, feet, etc.)
 */
function extractSpecsFromText(searchText: string): {
  ampHours?: number;
  diameter?: number; // inches
  wattage?: number;
  gallons?: number;
  feet?: number;
  gph?: number; // gallons per hour
  amperage?: number;
  cuft?: number; // cubic feet
  person?: number; // person capacity
  pounds?: number; // weight in pounds
} {
  const specs: any = {};
  
  // Amp hours (batteries)
  const ahPatterns = [
    /(\d+)\s*amp\s*hour/i,
    /(\d+)\s*amp\s*hr/i,
    /(\d+)\s*ah/i,
    /(\d+)\s*a\.h\./i,
    /(\d+)\s*ampere\s*hour/i,
  ];
  for (const pattern of ahPatterns) {
    const match = searchText.match(pattern);
    if (match) {
      specs.ampHours = parseInt(match[1], 10);
      break;
    }
  }
  
  // Diameter (propellers, fenders, radar)
  const diameterPatterns = [
    /(\d+)\s*inch/i,
    /(\d+)\s*in\b/i,
    /(\d+)"\s*(?:propeller|prop|fender|radar|panel)/i,
  ];
  for (const pattern of diameterPatterns) {
    const match = searchText.match(pattern);
    if (match) {
      specs.diameter = parseInt(match[1], 10);
      break;
    }
  }
  
  // Wattage (solar panels, inverters, wind generators)
  const wattagePatterns = [
    /(\d+)\s*watt/i,
    /(\d+)\s*w\b/i,
    /(\d+)w\s*(?:solar|panel|inverter|wind|generator)/i,
  ];
  for (const pattern of wattagePatterns) {
    const match = searchText.match(pattern);
    if (match) {
      specs.wattage = parseInt(match[1], 10);
      break;
    }
  }
  
  // Gallons (fuel/water tanks)
  const gallonPatterns = [
    /(\d+)\s*gallon/i,
    /(\d+)\s*gal\b/i,
  ];
  for (const pattern of gallonPatterns) {
    const match = searchText.match(pattern);
    if (match) {
      specs.gallons = parseInt(match[1], 10);
      break;
    }
  }
  
  // Feet (masts, ropes, chains, lines)
  const feetPatterns = [
    /(\d+)\s*foot/i,
    /(\d+)\s*ft\b/i,
    /(\d+)'\s*(?:mast|rope|chain|line|rode)/i,
  ];
  for (const pattern of feetPatterns) {
    const match = searchText.match(pattern);
    if (match) {
      specs.feet = parseInt(match[1], 10);
      break;
    }
  }
  
  // GPH (bilge pumps, watermakers)
  const gphPatterns = [
    /(\d+)\s*gph\b/i,
    /(\d+)\s*gallons?\s*per\s*hour/i,
  ];
  for (const pattern of gphPatterns) {
    const match = searchText.match(pattern);
    if (match) {
      specs.gph = parseInt(match[1], 10);
      break;
    }
  }
  
  // Amperage (battery chargers, shore power)
  const ampPatterns = [
    /(\d+)\s*amp\b/i,
    /(\d+)\s*a\b/i,
  ];
  for (const pattern of ampPatterns) {
    const match = searchText.match(pattern);
    if (match && !specs.ampHours) { // Don't override Ah if already found
      specs.amperage = parseInt(match[1], 10);
      break;
    }
  }
  
  // Cubic feet (refrigerators)
  const cuftPatterns = [
    /(\d+)\s*cu\s*ft/i,
    /(\d+)\s*cubic\s*foot/i,
  ];
  for (const pattern of cuftPatterns) {
    const match = searchText.match(pattern);
    if (match) {
      specs.cuft = parseInt(match[1], 10);
      break;
    }
  }
  
  // Person capacity (life rafts)
  const personPatterns = [
    /(\d+)\s*person/i,
    /(\d+)\s*man/i,
  ];
  for (const pattern of personPatterns) {
    const match = searchText.match(pattern);
    if (match) {
      specs.person = parseInt(match[1], 10);
      break;
    }
  }
  
  // Pounds (fire extinguishers)
  const poundPatterns = [
    /(\d+)\s*lb\b/i,
    /(\d+)\s*pound/i,
  ];
  for (const pattern of poundPatterns) {
    const match = searchText.match(pattern);
    if (match) {
      specs.pounds = parseInt(match[1], 10);
      break;
    }
  }
  
  return specs;
}

export function detectItemSpecs(
  title: string,
  description: string,
  category?: string
): ItemSpecs | null {
  const searchText = `${title} ${description}`.toLowerCase();
  const specs = extractSpecsFromText(searchText);

  // 1. Batteries with amp hour ratings (dynamic calculation)
  if (specs.ampHours && (searchText.includes("battery") || searchText.includes("batteries"))) {
    const isLithium = searchText.includes("lithium");
    const weightPerAh = isLithium ? 0.05 : 0.1;
    const weight = Math.round(specs.ampHours * weightPerAh * 10) / 10;
    const sizeMultiplier = Math.max(1, 1 + (specs.ampHours - 50) / 100);
    const baseLength = isLithium ? 15 : 30;
    const baseWidth = isLithium ? 10 : 20;
    const baseHeight = isLithium ? 5 : 20;
    
    return {
      weight,
      dimensions: {
        length: Math.round(baseLength * sizeMultiplier),
        width: Math.round(baseWidth * sizeMultiplier),
        height: Math.round(baseHeight * sizeMultiplier),
      },
      category: isLithium ? "electronics" : "marine",
      source: `${isLithium ? "Lithium" : "Marine"} battery ${specs.ampHours}Ah (estimated)`,
    };
  }
  
  // 2. Propellers by diameter (dynamic)
  if (specs.diameter && (searchText.includes("propeller") || searchText.includes("prop"))) {
    const diameter = specs.diameter;
    const weight = Math.round((diameter / 10) * 1.5 * 10) / 10; // ~1.5kg per 10 inches
    const size = Math.round(diameter * 2.5); // ~2.5cm per inch
    const height = Math.round(diameter * 0.8);
    
    return {
      weight,
      dimensions: { length: size, width: size, height },
      category: "marine",
      source: `Propeller ${diameter}" (estimated)`,
    };
  }
  
  // 3. Solar panels by wattage (dynamic)
  if (specs.wattage && searchText.includes("solar")) {
    const wattage = specs.wattage;
    const weight = Math.round((wattage / 100) * 8 * 10) / 10; // ~8kg per 100w
    const length = Math.round((wattage / 100) * 100); // ~100cm per 100w
    const width = wattage <= 200 ? 70 : 100;
    
    return {
      weight,
      dimensions: { length, width, height: 3 },
      category: "electronics",
      source: `Solar panel ${wattage}w (estimated)`,
    };
  }
  
  // 4. Inverters by wattage (dynamic)
  if (specs.wattage && searchText.includes("inverter")) {
    const wattage = specs.wattage;
    const weight = Math.round((wattage / 1000) * 3 * 10) / 10; // ~3kg per 1000w
    const length = Math.round(25 + (wattage / 1000) * 5);
    const width = Math.round(15 + (wattage / 1000) * 5);
    const height = Math.round(10 + (wattage / 1000) * 2);
    
    return {
      weight,
      dimensions: { length, width, height },
      category: "electronics",
      source: `Inverter ${wattage}w (estimated)`,
    };
  }
  
  // 5. Wind generators by wattage (dynamic)
  if (specs.wattage && (searchText.includes("wind") || searchText.includes("generator"))) {
    const wattage = specs.wattage;
    const weight = Math.round((wattage / 100) * 2 * 10) / 10; // ~2kg per 100w
    const size = Math.round(50 + (wattage / 100) * 5);
    const height = Math.round(30 + (wattage / 100) * 2.5);
    
    return {
      weight,
      dimensions: { length: size, width: size, height },
      category: "electronics",
      source: `Wind generator ${wattage}w (estimated)`,
    };
  }
  
  // 6. Fuel/water tanks by gallons (dynamic)
  if (specs.gallons && (searchText.includes("fuel tank") || searchText.includes("water tank"))) {
    const gallons = specs.gallons;
    const isWater = searchText.includes("water");
    const weight = Math.round(gallons * (isWater ? 3.8 : 3) + 5); // ~3.8kg per gallon water, ~3kg fuel + tank
    const size = Math.round(40 + (gallons / 10) * 3); // Scale with capacity
    
    return {
      weight,
      dimensions: { length: size, width: size * 0.8, height: size * 0.8 },
      category: "marine",
      source: `${isWater ? "Water" : "Fuel"} tank ${gallons}gal (estimated)`,
    };
  }
  
  // 7. Ropes/lines/chains by length in feet (dynamic)
  if (specs.feet && (searchText.includes("rope") || searchText.includes("line") || searchText.includes("chain") || searchText.includes("rode"))) {
    const feet = specs.feet;
    const isChain = searchText.includes("chain");
    const lengthCm = Math.round(feet * 30.48); // Convert feet to cm
    const weightPerFoot = isChain ? 0.5 : 0.04; // Chain is much heavier
    const weight = Math.round(feet * weightPerFoot * 10) / 10;
    const diameter = isChain ? 10 : 5;
    
    return {
      weight,
      dimensions: { length: lengthCm, width: diameter, height: diameter },
      category: "marine",
      source: `${isChain ? "Chain" : searchText.includes("rode") ? "Rode" : "Rope/Line"} ${feet}ft (estimated)`,
    };
  }
  
  // 8. Masts by length in feet (dynamic)
  if (specs.feet && searchText.includes("mast")) {
    const feet = specs.feet;
    const lengthCm = Math.round(feet * 30.48);
    const weight = Math.round((feet / 10) * 8 * 10) / 10; // ~8kg per 10ft
    const diameter = Math.round(15 + (feet / 10) * 0.5); // Scale with length
    
    return {
      weight,
      dimensions: { length: lengthCm, width: diameter, height: diameter },
      category: "marine",
      source: `Mast ${feet}ft (estimated)`,
    };
  }
  
  // 9. Bilge pumps by GPH (dynamic)
  if (specs.gph && searchText.includes("bilge")) {
    const gph = specs.gph;
    const weight = Math.round((gph / 500) * 1 * 10) / 10; // ~1kg per 500gph
    const size = Math.round(15 + (gph / 500) * 2.5);
    
    return {
      weight,
      dimensions: { length: size, width: size * 0.8, height: size * 0.8 },
      category: "marine",
      source: `Bilge pump ${gph}gph (estimated)`,
    };
  }
  
  // 10. Watermakers by GPH (dynamic)
  if (specs.gph && searchText.includes("watermaker")) {
    const gph = specs.gph;
    const weight = Math.round((gph / 6) * 15 * 10) / 10; // ~15kg per 6gph
    const size = Math.round(40 + (gph / 6) * 5);
    
    return {
      weight,
      dimensions: { length: size, width: size * 0.75, height: size * 0.75 },
      category: "marine",
      source: `Watermaker ${gph}gph (estimated)`,
    };
  }
  
  // 11. Battery chargers by amperage (dynamic)
  if (specs.amperage && searchText.includes("charger")) {
    const amps = specs.amperage;
    const weight = Math.round((amps / 10) * 1 * 10) / 10; // ~1kg per 10amp
    const length = Math.round(15 + (amps / 10) * 5);
    const width = Math.round(10 + (amps / 10) * 5);
    
    return {
      weight,
      dimensions: { length, width, height: 8 },
      category: "electronics",
      source: `Battery charger ${amps}amp (estimated)`,
    };
  }
  
  // 12. Refrigerators by cubic feet (dynamic)
  if (specs.cuft && searchText.includes("refrigerator")) {
    const cuft = specs.cuft;
    const weight = Math.round(cuft * 8 * 10) / 10; // ~8kg per cuft
    const size = Math.round(50 + cuft * 5);
    
    return {
      weight,
      dimensions: { length: size, width: size * 0.9, height: size * 0.9 },
      category: "marine",
      source: `Refrigerator ${cuft}cuft (estimated)`,
    };
  }
  
  // 13. Life rafts by person capacity (dynamic)
  if (specs.person && searchText.includes("life raft")) {
    const person = specs.person;
    const weight = Math.round(person * 6 * 10) / 10; // ~6kg per person
    const length = Math.round(70 + person * 5);
    const width = Math.round(55 + person * 5);
    
    return {
      weight,
      dimensions: { length, width, height: 40 },
      category: "marine",
      source: `Life raft ${person}-person (estimated)`,
    };
  }
  
  // 14. Fire extinguishers by pounds (dynamic)
  if (specs.pounds && searchText.includes("fire extinguisher")) {
    const pounds = specs.pounds;
    const weight = Math.round((pounds + 1) * 0.453592 * 10) / 10; // Convert lbs to kg + container
    const length = Math.round(20 + pounds * 2.5);
    const diameter = Math.round(8 + pounds * 1.5);
    
    return {
      weight,
      dimensions: { length, width: diameter, height: diameter },
      category: "marine",
      source: `Fire extinguisher ${pounds}lb (estimated)`,
    };
  }
  
  // 15. Fenders by diameter (dynamic)
  if (specs.diameter && searchText.includes("fender")) {
    const diameter = specs.diameter;
    const weight = Math.round((diameter / 4) * 0.5 * 10) / 10; // ~0.5kg per 4 inches
    const length = Math.round(diameter * 3);
    const size = Math.round(diameter * 3);
    
    return {
      weight,
      dimensions: { length, width: size, height: size },
      category: "marine",
      source: `Fender ${diameter}" (estimated)`,
    };
  }
  
  // 16. Radar by diameter (dynamic)
  if (specs.diameter && searchText.includes("radar")) {
    const diameter = specs.diameter;
    const weight = Math.round((diameter / 6) * 4 * 10) / 10; // ~4kg per 6 inches
    const size = Math.round(diameter * 2.8);
    const height = Math.round(diameter * 0.8);
    
    return {
      weight,
      dimensions: { length: size, width: size, height },
      category: "electronics",
      source: `Radar ${diameter}" (estimated)`,
    };
  }

  // 2. Try to find exact matches in common items
  for (const [itemType, variants] of Object.entries(COMMON_ITEMS)) {
    const itemTypeMatch = searchText.includes(itemType);
    
    if (itemTypeMatch) {
      
      // Check for specific variants
      for (const [variant, spec] of Object.entries(variants)) {
        if (variant !== "default" && searchText.includes(variant)) {
          const itemSpec = typeof spec === "number" 
            ? { weight: spec, dimensions: { length: 30, width: 20, height: 20 }, category: "marine" }
            : spec as ItemSpec;
          return {
            ...itemSpec,
            source: `Matched: ${itemType} (${variant})`,
          };
        }
      }

      // Use default for this item type
      if (variants.default) {
        const defaultSpec = typeof variants.default === "number"
          ? { weight: variants.default, dimensions: { length: 30, width: 20, height: 20 }, category: "marine" }
          : variants.default as ItemSpec;
        return {
          ...defaultSpec,
          source: `Matched: ${itemType} (typical)`,
        };
      }
    }
  }

  // 2. Use category default as last resort (weight only)
  if (category && CATEGORY_DEFAULTS[category]) {
    const range = CATEGORY_DEFAULTS[category];
    return {
      weight: range.typical || (range.min + range.max) / 2,
      dimensions: { length: 30, width: 20, height: 20 }, // Generic default
      category,
      source: `Category default: ${category}`,
    };
  }

  return null;
}

/**
 * Detect weight from text (title/description) and category
 * Priority: 1) Weight in text, 2) Common item match, 3) Category default
 * @deprecated Use detectItemSpecs for full auto-fill. This is kept for backward compatibility.
 */
export function detectWeightFromText(
  title: string,
  description: string,
  category?: string
): WeightEstimate | null {
  const searchText = `${title} ${description}`.toLowerCase();

  // 1. Try to extract weight directly from text (e.g., "15kg anchor")
  const weightPatterns = [
    /(\d+(?:\.\d+)?)\s*kg/i, // "15kg" or "15 kg"
    /(\d+(?:\.\d+)?)\s*kilogram/i, // "15 kilogram"
    /(\d+(?:\.\d+)?)\s*lb/i, // "15lb" (convert to kg)
    /(\d+(?:\.\d+)?)\s*pound/i, // "15 pound"
    /weight[:\s]+(\d+(?:\.\d+)?)/i, // "Weight: 15"
  ];

  for (const pattern of weightPatterns) {
    const match = searchText.match(pattern);
    if (match) {
      let weight = parseFloat(match[1]);

      // Convert lbs to kg if needed
      if (pattern.source.includes("lb") || pattern.source.includes("pound")) {
        weight = weight * 0.453592;
      }

      if (weight > 0 && weight < 1000) {
        // Sanity check
        return {
          weight: Math.round(weight * 10) / 10,
          confidence: "high",
          source: "Found weight in text",
        };
      }
    }
  }

  // 2. Try to find exact matches in common items
  for (const [itemType, variants] of Object.entries(COMMON_ITEMS)) {
    // Check if item type appears in text (e.g., "battery" in "marine battery")
    const itemTypeMatch = searchText.includes(itemType);
    
    if (itemTypeMatch) {
      // For batteries, try to extract amp hour values from text (more flexible patterns)
      if (itemType === "battery") {
        // Check for amp hour patterns first (before checking variants)
        const ampHourPatterns = [
          /(\d+)\s*amp\s*hour/i, // "240 amp hour" or "240amp hour"
          /(\d+)\s*amp\s*hr/i, // "240 amp hr"
          /(\d+)\s*amp/i, // "240amp" or "240 amp" (flexible spacing)
          /(\d+)\s*ah/i, // "240ah" or "240 ah"
          /(\d+)\s*a\.h\./i, // "240 a.h."
          /(\d+)\s*ampere\s*hour/i, // "240 ampere hour"
        ];
        
        let detectedAmpHours: number | null = null;
        for (const pattern of ampHourPatterns) {
          const match = searchText.match(pattern);
          if (match) {
            detectedAmpHours = parseInt(match[1], 10);
            break;
          }
        }
        
        // If we detected amp hours, calculate weight based on typical battery density
        if (detectedAmpHours) {
          // Typical marine battery: ~0.1kg per Ah (e.g., 100Ah = 10kg, 240Ah = 24kg)
          const estimatedWeight = Math.round(detectedAmpHours * 0.1 * 10) / 10;
          return {
            weight: estimatedWeight,
            confidence: "high",
            source: `Marine battery ${detectedAmpHours}Ah (estimated)`,
          };
        }
      }
      
      // Check for specific variants (e.g., "200ah battery")
      for (const [variant, spec] of Object.entries(variants)) {
        if (variant !== "default" && searchText.includes(variant)) {
          const weight = typeof spec === "number" ? spec : (spec as ItemSpec).weight;
          return {
            weight,
            confidence: "high",
            source: `Matched: ${itemType} (${variant})`,
          };
        }
      }

      // Use default for this item type
      if (variants.default) {
        const weight = typeof variants.default === "number" 
          ? variants.default 
          : (variants.default as ItemSpec).weight;
        return {
          weight,
          confidence: "medium",
          source: `Matched: ${itemType} (typical)`,
        };
      }
    }
  }

  // 3. Use category default as last resort
  if (category && CATEGORY_DEFAULTS[category]) {
    const range = CATEGORY_DEFAULTS[category];
    return {
      weight: range.typical || (range.min + range.max) / 2,
      confidence: "low",
      source: `Category default: ${category}`,
    };
  }

  return null;
}

/**
 * Estimate weight from dimensions and feel
 * Improved to consider item density more accurately
 */
export function estimateWeightFromFeel(
  length: number,
  width: number,
  height: number,
  feel: WeightFeel
): number {
  const volumeLiters = (length * width * height) / 1000;
  const densityRange = WEIGHT_FEEL_DENSITIES[feel];
  
  // Use typical density, but apply some adjustment based on volume
  // Larger items tend to have slightly lower density (more air/voids)
  // Smaller items tend to be more solid
  let density = densityRange.typical;
  
  if (volumeLiters > 50) {
    // Large items: use lower end of density range (account for packaging/voids)
    density = densityRange.typical * 0.9;
  } else if (volumeLiters < 5) {
    // Small items: use higher end (more solid)
    density = densityRange.typical * 1.1;
  }
  
  // Clamp to min/max for the feel category
  density = Math.max(densityRange.min, Math.min(densityRange.max, density));
  
  const estimatedWeight = volumeLiters * density;

  // Round to reasonable precision
  return Math.round(estimatedWeight * 10) / 10; // 0.1kg precision
}

/**
 * Validate weight against dimensions (warn on extreme inconsistencies)
 */
export function validateWeightDimensions(
  weight: number,
  length: number,
  width: number,
  height: number
): { isValid: boolean; warning?: string } {
  if (
    !weight ||
    !length ||
    !width ||
    !height ||
    weight <= 0 ||
    length <= 0 ||
    width <= 0 ||
    height <= 0
  ) {
    return { isValid: true }; // Can't validate without all values
  }

  const volumeLiters = (length * width * height) / 1000;
  const density = weight / volumeLiters;

  // Extreme cases only (not accurate estimates)
  // Lead density ~11 kg/L, water ~1 kg/L, air ~0.001 kg/L
  if (density > 10) {
    return {
      isValid: false,
      warning:
        "This seems very heavy (denser than lead). Please double-check the weight.",
    };
  }

  if (density < 0.01 && volumeLiters > 10) {
    return {
      isValid: false,
      warning:
        "This seems very light for this size. Please double-check the weight.",
    };
  }

  return { isValid: true };
}

/**
 * Get weight range for a category
 */
export function getCategoryWeightRange(category: string): WeightRange | null {
  return CATEGORY_DEFAULTS[category] || null;
}

/**
 * Get reference items (optionally filtered by category)
 */
export function getReferenceItems(category?: string): ReferenceItem[] {
  if (category) {
    return REFERENCE_ITEMS.filter((item) => item.category === category);
  }
  return REFERENCE_ITEMS;
}
