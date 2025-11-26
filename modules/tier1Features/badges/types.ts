/**
 * Badge Types
 */

export interface Badge {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  icon: string | null;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  awarded_at: string;
  badge?: Badge; // Joined badge data
}

