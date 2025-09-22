
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { add, format, setHours, startOfDay, isBefore, startOfHour } from 'date-fns';
import { collection, doc, query, where, getDocs, Timestamp, runTransaction, serverTimestamp, getDoc, collectionGroup } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { facilities } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calendar as CalendarIcon, Loader2, Sparkles, ChevronsUpDown, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Booking, Facility, Team, TeamMember } from '@/lib/types';
import { suggestGameDetails } from '@/ai/flows/suggest-game-details';

const bookingSchema = z.object({
  facilityId: z.string().min(1, 'Please select a facility.'),
  date: z.date({ required_error: 'Please select a date.' }),
  timeSlot: z.string().min(1, 'Please select a time slot.'),
  teamId: z.string().optional(),
  postDescription: z.string().optional(),
  postSkillLevel: z.string().optional(),
  postRules: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface BookingSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  initialData?: {
    facilityId?: string;
    startTime?: Date;
  };
}

export function BookingSheet({ isOpen, onOpenChange, initialData }: BookingSheetProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [isMultiplayerGame, setIsMultiplayerGame] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isPostSectionOpen, setIsPostSectionOpen] = useState(false);
  const [userTeams, setUserTeams] = useState<Team[]>([]);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      facilityId: '',
      date: startOfDay(new Date()),
      timeSlot: '',
      teamId: '',
      postDescription: '',
      postSkillLevel: '',
      postRules: '',
    },
  });

  const selectedFacilityId = form.watch('facilityId');
  const selectedDate = form.watch('date');
  const selectedTeamId = form.watch('teamId');

  useEffect(() => {
    if (initialData) {
      form.reset({
        facilityId: initialData.facilityId || '',
        date: initialData.startTime ? startOfDay(initialData.startTime) : startOfDay(new Date()),
        timeSlot: initialData.startTime ? format(initialData.startTime, 'HH:00') : '',
        teamId: '',
        postDescription: '',
        postSkillLevel: '',
        postRules: '',
      });
    } else {
      form.reset({
        facilityId: '',
        date: startOfDay(new Date()),
        timeSlot: '',
        teamId: '',
        postDescription: '',
        postSkillLevel: '',
        postRules: '',
      });
    }
  }, [initialData, isOpen, form]);

  useEffect(() => {
    if (user && isOpen) {
      const fetchUserTeams = async () => {
        const teams: Team[] = [];
        const membersQuery = query(collectionGroup(db, 'members'), where('uid', '==', user.uid));
        const membersSnapshot = await getDocs(membersQuery);
        for (const memberDoc of membersSnapshot.docs) {
          const teamRef = memberDoc.ref.parent.parent;
          if (teamRef) {
            const teamDoc = await getDoc(teamRef);
            if (teamDoc.exists()) {
              teams.push({ id: teamDoc.id, ...teamDoc.data() } as Team);
            }
          }
        }
        setUserTeams(teams);
      };
      fetchUserTeams();
    }
  }, [user, isOpen]);

  useEffect(() => {
    const facility = facilities.find(f => f.id === selectedFacilityId) || null;

    setSelectedFacility(facility);
    const isMultiplayer = facility ? facility.minPlayers > 1 : false;
    setIsMultiplayerGame(isMultiplayer);
    if (isMultiplayer) setIsPostSectionOpen(true);
    else setIsPostSectionOpen(false);
  }, [selectedFacilityId]);

  const allTimeSlots = useMemo(() =>
    Array.from({ length: 15 }, (_, i) => setHours(startOfDay(new Date()), 7 + i)),
    []
  );

  useEffect(() => {
    if (selectedFacilityId && selectedDate) {
      const fetchAvailableSlots = async () => {
        setIsLoadingSlots(true);
        const dayStart = startOfDay(selectedDate);
        const dayEnd = add(dayStart, { hours: 23, minutes: 59 });

        const q = query(
          collection(db, 'bookings'),
          where('facilityId', '==', selectedFacilityId),
          where('startTime', '>=', Timestamp.fromDate(dayStart)),
          where('startTime', '<=', Timestamp.fromDate(dayEnd))
        );

        try {
          const querySnapshot = await getDocs(q);
          const bookedHours = querySnapshot.docs.map(doc => (doc.data() as Booking).startTime.toDate().getHours());
          const now = new Date();
          const available = allTimeSlots.filter(slot => {
            const slotWithDate = setHours(dayStart, slot.getHours());
            return !bookedHours.includes(slot.getHours()) && isBefore(now, slotWithDate);
          });
          setAvailableSlots(available);
        } catch (error) {
          console.error("Error fetching bookings:", error);
          toast({ title: 'Error', description: 'Could not load available slots.', variant: 'destructive' });
        } finally {
          setIsLoadingSlots(false);
        }
      };
      fetchAvailableSlots();
    }
  }, [selectedFacilityId, selectedDate, allTimeSlots, toast]);

  const handleAiSuggest = async () => {
    if (!selectedFacility || !form.getValues('timeSlot')) {
      toast({ title: 'Info Missing', description: 'Please select a facility and time slot first.', variant: 'destructive' });
      return;
    }
    setIsAiLoading(true);
    try {
      const input = {
        sport: selectedFacility.sports[0],
        time: format(setHours(form.getValues('date'), parseInt(form.getValues('timeSlot').split(':')[0])), 'h:mm a'),
        facility: selectedFacility.name,
      };
      const result = await suggestGameDetails(input);
      form.setValue('postDescription', result.description);
      form.setValue('postSkillLevel', result.suggestedSkillLevel);
      form.setValue('postRules', result.gameRules);
      toast({ title: 'Suggestions Applied!', description: 'AI has generated details for your post.' });
    } catch (error) {
      console.error('AI Suggestion Error:', error);
      toast({ title: 'AI Error', description: 'Could not generate suggestions.', variant: 'destructive' });
    } finally {
      setIsAiLoading(false);
    }
  };


  const onSubmit = async (data: BookingFormValues) => {
    if (!user || !selectedFacility) {
      toast({ title: 'Error', description: 'You must be logged in and select a facility.', variant: 'destructive' });
      return;
    }

    if (isMultiplayerGame && !data.teamId && (!data.postDescription || !data.postSkillLevel)) {
      toast({ title: 'Missing Details', description: 'Please fill in the Interest Hub post details to find players.', variant: 'destructive' });
      form.setError('postDescription', { message: 'Description is required for multiplayer games.' });
      return;
    }

    const [hour] = data.timeSlot.split(':').map(Number);
    const startTime = setHours(data.date, hour);
    const endTime = add(startTime, { hours: 1 });

    let teamMembers: TeamMember[] = [];
    if (data.teamId) {
      const membersQuery = query(collection(db, `teams/${data.teamId}/members`));
      const membersSnapshot = await getDocs(membersQuery);
      teamMembers = membersSnapshot.docs.map(doc => doc.data() as TeamMember);
    }

    try {
      await runTransaction(db, async (transaction) => {
        const bookingRef = doc(collection(db, "bookings"));

        const bookingData: any = {
          userId: user.uid,
          userName: user.displayName || 'Anonymous',
          facilityId: data.facilityId,
          startTime: Timestamp.fromDate(startTime),
          endTime: Timestamp.fromDate(endTime),
          status: 'pending',
          createdAt: serverTimestamp(),
        };

        if (data.teamId) {
          bookingData.teamId = data.teamId;
          bookingData.participantIds = teamMembers.map(m => m.uid);
        }

        transaction.set(bookingRef, bookingData);

        if (isMultiplayerGame) {
          const postRef = doc(collection(db, "interestHubPosts"));
          const players = data.teamId ? teamMembers.map(m => m.uid) : [user.uid];

          transaction.set(postRef, {
            bookingId: bookingRef.id,
            authorId: user.uid,
            authorName: user.displayName || 'Anonymous',
            authorPhotoURL: user.photoURL || null,
            facilityId: selectedFacility.id,
            facilityName: selectedFacility.name,
            sport: selectedFacility.sports[0] || 'Game',
            startTime: Timestamp.fromDate(startTime),
            endTime: Timestamp.fromDate(endTime),
            description: data.postDescription,
            skillLevel: data.postSkillLevel,
            rules: data.postRules,
            players: players,
            maxPlayers: selectedFacility.maxPlayers,
            createdAt: serverTimestamp(),
          });
        }
      });

      toast({ title: 'Booking Request Sent', description: 'Your booking is pending approval.' });
      onOpenChange(false);

    } catch (error: any) {
      console.error("Error creating booking: ", error);
      toast({ title: 'Booking Failed', description: error.message, variant: 'destructive' });
    }
  };

  const relevantTeams = userTeams.filter(team => selectedFacility?.sports.includes(team.sport));

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New Facility Booking</SheetTitle>
          <SheetDescription>Fill in the details below to request a booking. All bookings are subject to approval.</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6">
            <FormField
              control={form.control}
              name="facilityId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facility</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a facility" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>

                      {facilities.filter(f => f.status === 'Available').map(facility => (
                        <SelectItem key={facility.id} value={facility.id}>{facility.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < startOfHour(new Date()) || date > add(new Date(), { days: 14 })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="timeSlot"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time Slot</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingSlots || availableSlots.length === 0}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingSlots ? "Loading slots..." : availableSlots.length > 0 ? "Select an available time" : "No slots available for this day"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableSlots.map(slot => (
                        <SelectItem key={slot.toISOString()} value={format(slot, 'HH:mm')}>
                          {format(slot, 'h:mm a')} - {format(add(slot, { hours: 1 }), 'h:mm a')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isMultiplayerGame && (
              <FormField
                control={form.control}
                name="teamId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Users className="h-4 w-4" /> Book for a team? (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedFacility || relevantTeams.length === 0}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={!selectedFacility ? "Select a facility first" : relevantTeams.length > 0 ? "Select your team" : "No teams for this sport"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="a">Book as individual</SelectItem>
                        {relevantTeams.map(team => (
                          <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Booking for a team will automatically create an Interest Hub post with all members.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {isMultiplayerGame && !selectedTeamId && (
              <Collapsible open={isPostSectionOpen} onOpenChange={setIsPostSectionOpen} className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-semibold">Find Players on the Interest Hub</h4>
                    <p className="text-sm text-muted-foreground">Create a post to invite others to join your game.</p>
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-9 p-0">
                      <ChevronsUpDown className="h-4 w-4" />
                      <span className="sr-only">Toggle</span>
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent className="space-y-4">
                  <Button type="button" variant="outline" size="sm" onClick={handleAiSuggest} disabled={isAiLoading}>
                    {isAiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Suggest Details with AI
                  </Button>
                  <FormField control={form.control} name="postDescription" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Post Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="E.g., Casual 5v5 game, looking for friendly players..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="postSkillLevel" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Suggested Skill Level</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., Beginners welcome, Intermediate" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="postRules" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Game Rules (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Any specific rules? E.g., No slide tackles." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CollapsibleContent>
              </Collapsible>
            )}

            <SheetFooter>
              <SheetClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </SheetClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Request Booking
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
