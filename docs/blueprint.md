# **App Name**: CET Court Connect

## Core Features:

- User Authentication: Implement user sign-up and login functionality using Firebase Authentication (email/password and Google).
- Profile Creation: Upon successful sign-up, create a user profile in Firestore with uid, displayName, email, and a default role of 'student'.
- Protected Routes: Implement protected routes using React Router, redirecting non-authenticated users to the login page.
- User Profile Display: Display the logged-in user's profile information (displayName, email, photoURL) on the 'My Profile' page.
- Logout Functionality: Implement a 'Logout' button that signs the user out using Firebase Authentication and redirects them to the login page.
- Profile Update: Allow users to update their displayName through a form, reflecting changes in Firebase Auth and Firestore.
- Facility Browser: Display a grid of facility cards with name, type, image, and status badge.
- Facility Search: Implement a search bar to filter facilities by name or type.
- Enhanced Schedule View: Display a timeline interface showing 60-minute time slots for the current day, color-coded based on booking status (available, confirmed, pending).
- Real-time Schedule Updates: Use a real-time listener to update the schedule instantly when a booking is made elsewhere.
- Dynamic Booking Modal: Modal for creating new bookings with options for sharing preference and cooldown management.
- My Bookings Dashboard: Dashboard to view confirmed, pending, upcoming, and past bookings.
- Interest Hub Integration: Automatically create a social media style post when a booking is created for a sport requiring multiple players.
- Interest Hub Activity Feed: Display posts in reverse chronological order, with filters, showing facility/time, author, and the Join Game CTA.
- Join Game Functionality: Allow users to join games. Check for scheduling conflicts, add users to bookings, confirm bookings once minimum player counts are met.  A backend tool is used to increment player counts and update statuses.
- Team Management: Allow users to create a new team, giving it a name and selecting a sport. The creator is automatically an admin. Display a list of teams the user is a member of. If the user is a team admin, provide an interface to manage the roster (invite/remove members).
- Team Booking Workflow: Upon selecting a team, the system should automatically fetch the team's member list from the teams/{teamId}/members subcollection. These members are then automatically added to the booking's participants list.
- Fault Tolerance & UX Polish: Implement loading states, empty states, and error handling.

## Style Guidelines:

- Primary color: A vibrant blue (#29ABE2) to represent trustworthiness and the college spirit.
- Background color: A light gray (#F0F2F5) to provide a clean and modern backdrop.
- Accent color: An energetic orange (#F26419) for calls to action and important notifications, creating a sense of urgency and excitement.
- Body and headline font: 'PT Sans' (sans-serif) for a modern and easily readable style throughout the app.
- Employ a grid-based layout system for responsiveness and consistent spacing.
- Use simple and modern icons to represent different sports and facilities, ensuring visual clarity and user-friendliness.
- Incorporate subtle animations for button hover states and transitions to enhance user interaction and provide visual feedback.