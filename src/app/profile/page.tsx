"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from "@/hooks/use-toast";
import { LogOut, User as UserIcon } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error: any) {
      toast({
        title: "Logout Failed",
        description: error.message,
        variant: "destructive",
      })
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !displayName || displayName === user.displayName) {
        return;
    }
    
    setIsLoading(true);

    try {
      await updateProfile(user, { displayName });

      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { displayName });

      toast({
        title: "Success!",
        description: "Your profile has been updated.",
      });

    } catch (error: any) {
        toast({
            title: "Update Failed",
            description: error.message,
            variant: "destructive",
        })
    } finally {
        setIsLoading(false);
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center space-x-4 pb-4">
            <Avatar className="h-20 w-20">
                <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || 'User'} />
                <AvatarFallback className="text-3xl bg-primary/20 text-primary font-semibold">
                    {user?.photoURL ? <UserIcon /> : getInitials(user?.displayName)}
                </AvatarFallback>
            </Avatar>
            <div>
                <CardTitle className="text-2xl font-headline">{user?.displayName}</CardTitle>
                <CardDescription>{user?.email}</CardDescription>
            </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" disabled={isLoading || displayName === user?.displayName}>
                {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
            <Button variant="outline" onClick={handleLogout} className="w-full">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
