
"use client";

import { useEffect, useState } from 'react';
import { collectionGroup, query, where, onSnapshot, getDoc, collection, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import type { Team } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CreateTeamDialog } from '@/components/create-team-dialog';
import { TeamCard } from '@/components/team-card';
import { PlusCircle, Users } from 'lucide-react';

export default function TeamsPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const membersQuery = query(collectionGroup(db, 'members'), where('uid', '==', user.uid));

    const unsubscribe = onSnapshot(membersQuery, async (snapshot) => {
      setLoading(true);
      try {
        const teamsData: Team[] = await Promise.all(snapshot.docs.map(async (memberDoc) => {
          const teamRef = memberDoc.ref.parent.parent;
          if (!teamRef) return null;

          const teamDoc = await getDoc(teamRef);
          if (!teamDoc.exists()) return null;
          
          const membersCol = collection(db, 'teams', teamDoc.id, 'members');
          const memberCountSnapshot = await getCountFromServer(membersCol);
          const memberCount = memberCountSnapshot.data().count;

          return { id: teamDoc.id, ...teamDoc.data(), memberCount } as Team;
        }));
        
        setTeams(teamsData.filter((t): t is Team => t !== null));
      } catch (err) {
        console.error(err);
        setError("Failed to load your teams.");
      } finally {
        setLoading(false);
      }
    }, (err) => {
      console.error(err);
      setError("Failed to load your teams.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight font-headline">My Teams</h1>
            <p className="text-muted-foreground">Manage your teams and team memberships.</p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Team
          </Button>
        </div>

        {teams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {teams.map(team => (
              <TeamCard key={team.id} team={team} isAdmin={team.adminIds.includes(user?.uid || '')} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-muted/50 rounded-lg flex flex-col items-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">No Teams Yet</h3>
            <p className="text-muted-foreground mt-2 max-w-sm">
              You haven't joined or created any teams. Create a team to start booking facilities with your friends!
            </p>
            <Button className="mt-6" onClick={() => setIsCreateDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Your First Team
            </Button>
          </div>
        )}
      </div>
      <CreateTeamDialog isOpen={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
    </>
  );
}
