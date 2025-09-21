
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { doc, collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { facilities } from '@/lib/data';
import type { Facility, Booking } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { add, format, startOfDay, endOfDay, setHours } from 'date-fns';
import { Clock, User, PlusCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from "lucide-react"
import { useDashboard } from '@/app/dashboard/layout';
import { Button } from '@/components/ui/button';

export default function SchedulePage() {
  const params = useParams();
  const id = params.id as string;

  const [facility, setFacility] = useState<Facility | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { openBookingSheet } = useDashboard();

  useEffect(() => {
    const facilityData = facilities.find((f) => f.id === id) || null;
    setFacility(facilityData);

    if (!facilityData) {
      setError("Facility not found.");
      setLoading(false);
      return;
    }

    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const q = query(
      collection(db, 'bookings'),
      where('facilityId', '==', id),
      where('startTime', '>=', Timestamp.fromDate(todayStart)),
      where('startTime', '<=', Timestamp.fromDate(todayEnd))
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const bookingsData: Booking[] = [];
      querySnapshot.forEach((doc) => {
        bookingsData.push({ id: doc.id, ...doc.data() } as Booking);
      });
      setBookings(bookingsData);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setError("Failed to load bookings.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const timeSlots = Array.from({ length: 15 }, (_, i) => setHours(startOfDay(new Date()), 7 + i)); // 7 AM to 9 PM

  const placeholder = PlaceHolderImages.find(p => p.id === facility?.image);

  if (loading) {
    return <ScheduleSkeleton />;
  }

  if (error) {
     return (
        <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
     )
  }

  if (!facility) {
    return <div>Facility not found.</div>;
  }

  return (
    <div className="space-y-6">
        <div className="relative h-64 w-full rounded-lg overflow-hidden">
            <Image
                src={placeholder?.imageUrl || "https://picsum.photos/seed/placeholder/1200/400"}
                alt={facility.name}
                fill
                className="object-cover"
                data-ai-hint={placeholder?.imageHint || 'sports facility'}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-6 left-6">
                <h1 className="text-3xl font-bold text-white font-headline">{facility.name}</h1>
                <p className="text-lg text-white/90">{facility.type}</p>
            </div>
        </div>

      <Card>
        <CardHeader>
          <CardTitle>Today's Schedule ({format(new Date(), 'eeee, MMMM do')})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {timeSlots.map((slot, index) => {
              const booking = bookings.find(b => b.startTime.toDate().getHours() === slot.getHours());
              const isAvailable = !booking;
              const status = booking?.status;

              return (
                <div key={index} className="flex items-center gap-4 p-4 rounded-lg border">
                  <div className="w-24 text-center">
                    <p className="font-semibold text-lg">{format(slot, 'h a')}</p>
                    <p className="text-sm text-muted-foreground">{format(add(slot, { hours: 1 }), 'h a')}</p>
                  </div>
                  <div className={`flex-1 p-4 rounded-md ${
                      isAvailable ? 'bg-green-100/50 dark:bg-green-900/20' : 
                      status === 'confirmed' ? 'bg-primary/20' : 'bg-accent/20'
                  }`}>
                    {isAvailable ? (
                       <div className="flex justify-between items-center">
                         <p className="font-semibold text-green-800 dark:text-green-300">Available</p>
                         <Button size="sm" variant="outline" onClick={() => openBookingSheet({ facilityId: facility.id, startTime: slot })}>
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Book Now
                         </Button>
                       </div>
                    ) : (
                      <div className='flex items-start gap-4'>
                          <div className={`w-1.5 h-12 rounded-full ${status === 'confirmed' ? 'bg-primary' : 'bg-accent'}`} />
                          <div>
                            <p className={`font-bold ${status === 'confirmed' ? 'text-primary' : 'text-accent-foreground'}`}>
                                {status === 'confirmed' ? 'Confirmed Booking' : 'Pending Approval'}
                            </p>
                            <div className="text-sm text-muted-foreground mt-1 flex items-center gap-4">
                               <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" />{booking.userName}</span>
                               <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{format(booking.startTime.toDate(), 'h:mm a')} - {format(booking.endTime.toDate(), 'h:mm a')}</span>
                            </div>
                          </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


function ScheduleSkeleton() {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full rounded-lg" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
                <div className="w-24">
                  <Skeleton className="h-6 w-16 mx-auto" />
                  <Skeleton className="h-4 w-12 mx-auto mt-2" />
                </div>
                <Skeleton className="h-16 flex-1" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

    