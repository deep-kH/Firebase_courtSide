import type { Timestamp } from 'firebase/firestore';

export interface Facility {
  id: string;
  name: string;
  type: 'Indoor' | 'Outdoor' | 'Aquatic' | 'Gym';
  sports: string[];
  image: string;
  status: 'Available' | 'Maintenance' | 'Closed';
}

export interface Booking {
  id: string;
  facilityId: string;
  userId: string;
  userName: string;
  startTime: Timestamp;
  endTime: Timestamp;
  status: 'confirmed' | 'pending';
}
