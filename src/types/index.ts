export interface User {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface World {
  id: string;
  name: string;
  tagline: string | null;
  anniversary_date: string | null;
  cover_photo_url: string | null;
  theme_color: string;
  created_at: string;
  created_by: string;
}

export interface WorldMember {
  id: string;
  world_id: string;
  user_id: string;
  nickname: string | null;
  role: 'owner' | 'partner';
  joined_at: string;
  user?: User;
}

export interface Trip {
  id: string;
  world_id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_date: string;
  end_date: string | null;
  cover_photo_url: string | null;
  song_url: string | null;
  theme_color: string | null;
  created_by: string;
  created_at: string;
  memory_count?: number;
  photo_count?: number;
}

export interface Memory {
  id: string;
  world_id: string;
  trip_id: string | null;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  mood: string | null;
  is_favorite: boolean;
  created_by: string;
  created_at: string;
  photos?: MemoryPhoto[];
  tags?: Tag[];
  trip?: Trip;
  creator?: User;
}

export interface MemoryPhoto {
  id: string;
  memory_id: string;
  url: string;
  caption: string | null;
  width: number | null;
  height: number | null;
  sort_order: number;
  created_at: string;
}

export interface Letter {
  id: string;
  world_id: string;
  title: string;
  body: string;
  recipient: string | null;
  open_condition: string | null;
  open_date: string | null;
  is_locked: boolean;
  photo_url: string | null;
  music_url: string | null;
  created_by: string;
  created_at: string;
  creator?: User;
}

export interface FutureMemory {
  id: string;
  world_id: string;
  title: string;
  description: string | null;
  emoji: string | null;
  is_completed: boolean;
  completed_at: string | null;
  memory_id: string | null;
  created_by: string;
  created_at: string;
}

export interface Tag {
  id: string;
  world_id: string;
  name: string;
  color: string | null;
}

export interface TimelineEvent {
  id: string;
  world_id: string;
  title: string;
  description: string | null;
  date: string;
  type: 'milestone' | 'trip' | 'birthday' | 'anniversary' | 'date' | 'custom';
  emoji: string | null;
  memory_id: string | null;
  trip_id: string | null;
  created_by: string;
  created_at: string;
}

export interface WorldStats {
  days_together: number;
  trip_count: number;
  memory_count: number;
  letter_count: number;
  photo_count: number;
  place_count: number;
  favorite_count: number;
}

export interface WorldInvite {
  id: string;
  world_id: string;
  created_by: string;
  code: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  message: string | null;
  expires_at: string;
  accepted_by: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export type Mood = 'happy' | 'romantic' | 'adventurous' | 'peaceful' | 'funny' | 'nostalgic' | 'grateful' | 'excited';

export const MOOD_LABELS: Record<Mood, string> = {
  happy: '😊 Happy',
  romantic: '💕 Romantic',
  adventurous: '🌟 Adventurous',
  peaceful: '☁️ Peaceful',
  funny: '😂 Funny',
  nostalgic: '🌸 Nostalgic',
  grateful: '🙏 Grateful',
  excited: '✨ Excited',
};

export const STICKERS = [
  { id: 'bow', emoji: '🎀', label: 'Bow' },
  { id: 'heart', emoji: '♡', label: 'Heart' },
  { id: 'star', emoji: '⭐', label: 'Star' },
  { id: 'flower', emoji: '🌸', label: 'Flower' },
  { id: 'cloud', emoji: '☁️', label: 'Cloud' },
  { id: 'shell', emoji: '🐚', label: 'Shell' },
  { id: 'strawberry', emoji: '🍓', label: 'Strawberry' },
  { id: 'bear', emoji: '🧸', label: 'Teddy' },
  { id: 'camera', emoji: '📷', label: 'Camera' },
  { id: 'airplane', emoji: '✈️', label: 'Airplane' },
  { id: 'moon', emoji: '🌙', label: 'Moon' },
  { id: 'sparkle', emoji: '✨', label: 'Sparkle' },
  { id: 'cake', emoji: '🎂', label: 'Cake' },
  { id: 'coffee', emoji: '☕', label: 'Coffee' },
  { id: 'cat', emoji: '🐱', label: 'Cat' },
  { id: 'ribbon', emoji: '🎁', label: 'Gift' },
  { id: 'cherry', emoji: '🍒', label: 'Cherry' },
  { id: 'ice-cream', emoji: '🍦', label: 'Ice Cream' },
];
