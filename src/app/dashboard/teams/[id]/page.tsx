
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, collection, query, where, getDocs, writeBatch, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import type { Team, TeamMember } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, UserPlus, Trash2, Shield, Loader2, Crown } from 'lucide-react';
import Link from 'next/link';

export default function TeamDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const { user } = useAuth();
    const { toast } = useToast();

    const [team, setTeam] = useState<Team | null>(null);
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddingMember, setIsAddingMember] = useState(false);
    const [addMemberEmail, setAddMemberEmail] = useState('');
    const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);

    useEffect(() => {
        if (!id) return;

        const teamRef = doc(db, 'teams', id);
        const unsubscribeTeam = onSnapshot(teamRef, (doc) => {
            if (doc.exists()) {
                setTeam({ id: doc.id, ...doc.data() } as Team);
            } else {
                setTeam(null);
            }
            setLoading(false);
        });

        const membersRef = collection(db, 'teams', id, 'members');
        const unsubscribeMembers = onSnapshot(membersRef, (snapshot) => {
            const membersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamMember));
            setMembers(membersData);
        });

        return () => {
            unsubscribeTeam();
            unsubscribeMembers();
        };
    }, [id]);
    
    const isAdmin = user && team ? team.adminIds.includes(user.uid) : false;

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!addMemberEmail || !team) return;

        setIsAddingMember(true);
        try {
            // Find user by email
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', addMemberEmail));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                throw new Error('User with this email not found.');
            }

            const userToAddDoc = querySnapshot.docs[0];
            const userToAdd = userToAddDoc.data();

            // Check if user is already a member
            if (members.some(m => m.uid === userToAdd.uid)) {
                throw new Error('This user is already a member of the team.');
            }

            // Add member
            const memberRef = collection(db, 'teams', team.id, 'members');
            await addDoc(memberRef, {
                uid: userToAdd.uid,
                displayName: userToAdd.displayName,
                email: userToAdd.email,
                photoURL: userToAdd.photoURL,
                joinedAt: serverTimestamp(),
            });

            toast({ title: 'Member Added', description: `${userToAdd.displayName} has been added to the team.` });
            setAddMemberEmail('');
            setIsAddMemberDialogOpen(false);
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsAddingMember(false);
        }
    };

    const handleRemoveMember = async (memberUid: string) => {
        if (!team) return;
        try {
            const membersRef = collection(db, 'teams', team.id, 'members');
            const q = query(membersRef, where('uid', '==', memberUid));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const memberDocId = snapshot.docs[0].id;
                await deleteDoc(doc(db, 'teams', team.id, 'members', memberDocId));
                toast({ title: 'Member Removed', description: 'The member has been removed from the team.' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to remove member.', variant: 'destructive' });
        }
    };
    
    const getInitials = (name: string | null | undefined) => {
        if (!name) return '';
        const nameParts = name.split(' ');
        if (nameParts.length > 1) {
            return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }


    if (loading) {
        return <Skeleton className="h-96 w-full" />;
    }

    if (!team) {
        return <div>Team not found.</div>;
    }

    return (
        <div className="space-y-6">
            <Link href="/dashboard/teams" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to all teams
            </Link>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div>
                            <CardTitle className="text-3xl font-bold font-headline">{team.name}</CardTitle>
                            <CardDescription className="text-lg">{team.sport}</CardDescription>
                        </div>
                        {isAdmin && (
                            <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button><UserPlus className="mr-2 h-4 w-4" /> Add Member</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add New Member</DialogTitle>
                                        <DialogDescription>Enter the email address of the user you want to invite.</DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleAddMember}>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="email" className="text-right">Email</Label>
                                                <Input id="email" type="email" value={addMemberEmail} onChange={(e) => setAddMemberEmail(e.target.value)} className="col-span-3" required />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" disabled={isAddingMember}>
                                                {isAddingMember && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Add Member
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <h3 className="text-lg font-semibold mb-4">Team Roster ({members.length})</h3>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Member</TableHead>
                                    <TableHead>Email</TableHead>
                                    {isAdmin && <TableHead className="text-right">Action</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members.map(member => (
                                    <TableRow key={member.uid}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={member.photoURL || undefined} />
                                                    <AvatarFallback className="bg-muted">{getInitials(member.displayName)}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{member.displayName}</span>
                                                {team.adminIds.includes(member.uid) && <Badge variant="secondary"><Crown className="mr-1.5 h-3.5 w-3.5 text-amber-500" />Admin</Badge>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{member.email}</TableCell>
                                        {isAdmin && (
                                            <TableCell className="text-right">
                                                {user?.uid !== member.uid && !team.adminIds.includes(member.uid) && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This will permanently remove {member.displayName} from the team. This action cannot be undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleRemoveMember(member.uid)} className="bg-destructive hover:bg-destructive/90">
                                                                    Yes, Remove Member
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                )}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
