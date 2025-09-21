
"use client";

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import type { Booking } from '@/lib/types';
import { facilities } from '@/lib/data';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CalendarOff, CalendarCheck, History, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function MyBookingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    };

    const q = query(
      collection(db, 'bookings'),
      where('userId', '==', user.uid),
      orderBy('startTime', 'desc')
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
      setError("Failed to load your bookings.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCancelBooking = async (bookingId: string) => {
    setIsCancelling(bookingId);
    try {
      await deleteDoc(doc(db, "bookings", bookingId));
      toast({
        title: "Booking Cancelled",
        description: "Your booking has been successfully cancelled.",
      });
    } catch (error) {
      console.error("Error cancelling booking: ", error);
      toast({
        title: "Cancellation Failed",
        description: "Could not cancel the booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(null);
    }
  };

  const now = Timestamp.now();
  const upcomingBookings = bookings.filter(b => b.status === 'confirmed' && b.startTime > now);
  const pendingBookings = bookings.filter(b => b.status === 'pending' && b.startTime > now);
  const pastBookings = bookings.filter(b => b.startTime <= now);

  const getFacilityName = (facilityId: string) => {
    return facilities.find(f => f.id === facilityId)?.name || 'Unknown Facility';
  };
  
  const renderBookingsTable = (bookings: Booking[], isCancellable: boolean = false) => {
    if (bookings.length === 0) {
      return (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No bookings found.</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Facility</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Status</TableHead>
            {isCancellable && <TableHead className="text-right">Action</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => (
            <TableRow key={booking.id}>
              <TableCell className="font-medium">{getFacilityName(booking.facilityId)}</TableCell>
              <TableCell>{format(booking.startTime.toDate(), 'MMM d, yyyy')}</TableCell>
              <TableCell>{format(booking.startTime.toDate(), 'h:mm a')} - {format(booking.endTime.toDate(), 'h:mm a')}</TableCell>
              <TableCell>
                <Badge variant={booking.status === 'confirmed' ? 'default' : booking.status === 'pending' ? 'secondary' : 'outline'}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </Badge>
              </TableCell>
              {isCancellable && (
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" disabled={isCancelling === booking.id}>
                        {isCancelling === booking.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Cancel
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently cancel your booking for {getFacilityName(booking.facilityId)} on {format(booking.startTime.toDate(), 'MMM d, yyyy')}.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Back</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleCancelBooking(booking.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Yes, Cancel
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };
  
  if (loading) {
    return (
        <div>
            <Skeleton className="h-9 w-64 mb-4" />
            <Skeleton className="h-10 w-full max-w-sm mb-6" />
            <Card>
                <CardContent className="p-6">
                    <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
        </div>
    );
  }

  if (error) {
    return <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
    </Alert>;
  }


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight font-headline">My Bookings</h1>
        <p className="text-muted-foreground">View and manage your facility bookings.</p>
      </div>
      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming"><CalendarCheck className="mr-2 h-4 w-4" />Upcoming</TabsTrigger>
          <TabsTrigger value="pending"><Loader2 className="mr-2 h-4 w-4" />Pending</TabsTrigger>
          <TabsTrigger value="past"><History className="mr-2 h-4 w-4" />Past</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Bookings</CardTitle>
              <CardDescription>Your confirmed and scheduled bookings.</CardDescription>
            </CardHeader>
            <CardContent>
              {renderBookingsTable(upcomingBookings, true)}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Bookings</CardTitle>
              <CardDescription>These bookings are awaiting confirmation.</CardDescription>
            </CardHeader>
            <CardContent>
              {renderBookingsTable(pendingBookings, true)}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="past">
          <Card>
            <CardHeader>
              <CardTitle>Booking History</CardTitle>
              <CardDescription>A record of your past facility usage.</CardDescription>
            </CardHeader>
            <CardContent>
              {renderBookingsTable(pastBookings, false)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

    