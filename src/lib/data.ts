import type { Facility } from './types';

export const facilities: Facility[] = [
  {
    id: '1',
    name: 'Main Football Ground',
    type: 'Outdoor',
    sports: ['Football'],
    image: 'football-field',
    status: 'Available',
  },
  {
    id: '2',
    name: 'Basketball Court A',
    type: 'Outdoor',
    sports: ['Basketball'],
    image: 'basketball-court',
    status: 'Available',
  },
  {
    id: '3',
    name: 'Tennis Court 1',
    type: 'Outdoor',
    sports: ['Tennis'],
    image: 'tennis-court',
    status: 'Maintenance',
  },
  {
    id: '4',
    name: 'Olympic Swimming Pool',
    type: 'Aquatic',
    sports: ['Swimming'],
    image: 'swimming-pool',
    status: 'Available',
  },
  {
    id: '5',
    name: 'Indoor Badminton Court',
    type: 'Indoor',
    sports: ['Badminton'],
    image: 'badminton-court',
    status: 'Closed',
  },
  {
    id: '6',
    name: 'College Gymnasium',
    type: 'Gym',
    sports: ['Workout', 'Fitness'],
    image: 'gymnasium',
    status: 'Available',
  },
  {
    id: '7',
    name: 'Volleyball Court',
    type: 'Outdoor',
    sports: ['Volleyball'],
    image: 'volleyball-court',
    status: 'Available',
  },
   {
    id: '8',
    name: 'Table Tennis Hall',
    type: 'Indoor',
    sports: ['Table Tennis'],
    image: 'table-tennis',
    status: 'Available',
  }
];
