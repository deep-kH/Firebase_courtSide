
import type { Timestamp } from 'firebase/firestore';

export interface Facility {
  id: string;
  name: string;
  type: 'Indoor' | 'Outdoor' | 'Aquatic' | 'Gym';
  sports: string[];
  image: string;
  status: 'Available' | 'Maintenance' | 'Closed';
  minPlayers: number;
  maxPlayers: number;
}

export interface Booking {
  id: string;
  facilityId: string;
  userId: string;
  userName: string;
  startTime: Timestamp;
  endTime: Timestamp;
  status: 'confirmed' | 'pending' | 'cancelled';
  teamId?: string;
  participantIds?: string[];
}

export interface InterestHubPost {
  id:string;
  bookingId: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string | null;
  facilityId: string;
  facilityName: string;
  sport: string;
  startTime: Timestamp;
  endTime: Timestamp;
  description: string;
  skillLevel: string;
  rules: string;
  players: string[]; // array of user uids
  maxPlayers: number;
  createdAt: Timestamp;
}

export interface TeamMember {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  joinedAt: Timestamp;
}

export interface Team {
  id: string;
  name: string;
  sport: string;
  adminIds: string[];
  createdAt: Timestamp;
  memberCount?: number;
}
