
"use client";

import { useState } from 'react';
import type { InterestHubPost } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, query, collection, where, getDocs, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, MapPin, Calendar, Clock, Info, Loader2 } from 'lucide-react';

interface InterestHubPostCardProps {
    post: InterestHubPost;
}

export function InterestHubPostCard({ post }: InterestHubPostCardProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isJoining, setIsJoining] = useState(false);

    const isUserPlayer = user ? post.players.includes(user.uid) : false;
    const isGameFull = post.players.length >= post.maxPlayers;
    const isGamePast = post.startTime.toDate() < new Date();
    const canJoin = user && !isUserPlayer && !isGameFull && !isGamePast;
    
    const getInitials = (name: string) => {
        const nameParts = name.split(' ');
        if (nameParts.length > 1) {
            return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    const handleJoinGame = async () => {
        if (!user) {
            toast({ title: "Not Authenticated", description: "You must be logged in to join.", variant: "destructive" });
            return;
        }
        setIsJoining(true);

        try {
            // Conflict check
            const q = query(
                collection(db, 'bookings'),
                where('userId', '==', user.uid),
                where('status', 'in', ['confirmed', 'pending']),
                where('startTime', '<', post.endTime),
            );
            
            const querySnapshot = await getDocs(q);
            const conflictingBooking = querySnapshot.docs.find(doc => doc.data().endTime > post.startTime);

            if (conflictingBooking) {
                toast({
                    title: "Schedule Conflict",
                    description: "You already have a booking at this time.",
                    variant: "destructive"
                });
                return;
            }

            // Join game
            const postRef = doc(db, 'interestHubPosts', post.id);
            await updateDoc(postRef, {
                players: arrayUnion(user.uid)
            });

            toast({
                title: "You're in!",
                description: `You have successfully joined the game for ${post.sport}.`
            });

        } catch (error) {
            console.error("Error joining game: ", error);
            toast({ title: "Failed to Join", description: "An unexpected error occurred.", variant: "destructive" });
        } finally {
            setIsJoining(false);
        }
    };

    return (
        <Card className="flex flex-col h-full">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Avatar>
                        <AvatarImage src={post.authorPhotoURL || undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                            {getInitials(post.authorName)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-xl font-headline leading-tight">{post.sport} Game</CardTitle>
                        <CardDescription>Hosted by {post.authorName}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                <p className="text-sm text-muted-foreground italic">"{post.description}"</p>
                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> <span>{post.facilityName}</span></div>
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> <span>{format(post.startTime.toDate(), 'eeee, MMM d')}</span></div>
                    <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> <span>{format(post.startTime.toDate(), 'h:mm a')} - {format(post.endTime.toDate(), 'h:mm a')}</span></div>
                    <div className="flex items-center gap-2"><Info className="h-4 w-4 text-primary" /> <span>Skill: {post.skillLevel}</span></div>
                </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-4">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Users className="h-4 w-4 text-primary"/>
                        <span>{post.players.length} / {post.maxPlayers} Players</span>
                    </div>
                    {isGameFull && <Badge variant="secondary">Full</Badge>}
                    {isGamePast && !isGameFull && <Badge variant="outline">Past</Badge>}
                </div>
                <Button onClick={handleJoinGame} disabled={!canJoin || isJoining} className="w-full">
                     {isJoining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                     {isUserPlayer ? "You're a player" : "Join Game"}
                </Button>
            </CardFooter>
        </Card>
    )
}
