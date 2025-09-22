
"use client";

import { useEffect, useState, useMemo } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { InterestHubPost } from '@/lib/types';
import { facilities } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { InterestHubPostCard } from '@/components/interest-hub-post-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function InterestHubPage() {
  const [posts, setPosts] = useState<InterestHubPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sportFilter, setSportFilter] = useState('all');

  const availableSports = useMemo(() => {
    const sports = new Set(facilities.flatMap(f => f.sports));
    return Array.from(sports);
  }, []);
  console.log('availableSports', availableSports.filter(s => !s || s === ""));


  useEffect(() => {
    const q = query(collection(db, 'interestHubPosts'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const postsData: InterestHubPost[] = [];
      querySnapshot.forEach((doc) => {
        postsData.push({ id: doc.id, ...doc.data() } as InterestHubPost);
      });
      setPosts(postsData);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setError("Failed to load Interest Hub posts.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredPosts = useMemo(() => {
    if (sportFilter === 'all') {
      return posts;
    }
    return posts.filter(post => post.sport === sportFilter);
  }, [posts, sportFilter]);


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-80 w-full rounded-lg" />
            ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight font-headline">Interest Hub</h1>
          <p className="text-muted-foreground">Find a game and join other players from the community.</p>
        </div>
        <div className="w-full sm:w-auto">
            <Select value={sportFilter} onValueChange={setSportFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by sport" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Sports</SelectItem>
                    {availableSports.map(sport => (
                        <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </div>
      {filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map(post => (
            <InterestHubPostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-muted/50 rounded-lg">
            <h3 className="text-xl font-semibold">No Games Found</h3>
            <p className="text-muted-foreground mt-2">
                {sportFilter === 'all' 
                    ? "Be the first to create a booking for a multiplayer game!" 
                    : "No games found for this sport. Try another filter."
                }
            </p>
        </div>
      )}
    </div>
  );
}
