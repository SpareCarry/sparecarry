import { z } from "zod";

// User schemas
export const userRoleSchema = z.enum(["requester", "traveler", "sailor", "admin"]);

export const profileSchema = z.object({
  phone: z.string().optional(),
  boat_name: z.string().optional(),
  boat_type: z.string().optional(),
  boat_length_ft: z.number().int().positive().optional(),
  bio: z.string().max(1000).optional(),
  avatar_url: z.string().url().optional(),
});

// Trip schemas
export const tripTypeSchema = z.enum(["plane", "boat"]);

export const dimensionsSchema = z.object({
  length_cm: z.number().positive(),
  width_cm: z.number().positive(),
  height_cm: z.number().positive(),
});

export const tripSchema = z.object({
  type: tripTypeSchema,
  from_location: z.string().min(1),
  to_location: z.string().min(1),
  flight_number: z.string().optional(),
  departure_date: z.date(),
  eta_window_start: z.date(),
  eta_window_end: z.date(),
  spare_kg: z.number().nonnegative(),
  spare_volume_liters: z.number().nonnegative(),
  max_dimensions: dimensionsSchema.optional(),
  can_oversize: z.boolean().default(false),
});

// Request schemas
export const preferredMethodSchema = z.enum(["plane", "boat", "any", "quickest", "best_fit"]);

export const requestSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  from_location: z.string().min(1),
  to_location: z.string().min(1),
  deadline_earliest: z.date().optional(),
  deadline_latest: z.date(),
  max_reward: z.number().positive(),
  item_photos: z.array(z.string().url()).optional(),
  dimensions_cm: dimensionsSchema.optional(),
  weight_kg: z.number().positive(),
  value_usd: z.number().nonnegative().optional(),
  preferred_method: preferredMethodSchema.default("any"),
});

// Match schemas
export const matchStatusSchema = z.enum([
  "pending",
  "chatting",
  "escrow_paid",
  "delivered",
  "completed",
  "disputed",
]);

export const matchSchema = z.object({
  trip_id: z.string().uuid(),
  request_id: z.string().uuid(),
  status: matchStatusSchema.default("pending"),
  reward_amount: z.number().positive(),
});

// Message schemas
export const messageSchema = z.object({
  conversation_id: z.string().uuid(),
  content: z.string().min(1).max(5000),
});

// Delivery schemas
export const gpsLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const deliverySchema = z.object({
  match_id: z.string().uuid(),
  proof_photos: z.array(z.string().url()).optional(),
  gps_lat_long: gpsLocationSchema.optional(),
  meetup_location_id: z.string().uuid().optional(),
});

// Meetup location schemas
export const meetupLocationTypeSchema = z.enum(["airport", "marina", "fuel_dock"]);

export const meetupLocationSchema = z.object({
  name: z.string().min(1),
  type: meetupLocationTypeSchema,
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  notes: z.string().optional(),
});

