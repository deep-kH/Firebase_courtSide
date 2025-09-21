
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, runTransaction, collection, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { sportsList } from '@/lib/data';
import { suggestTeamNames } from '@/ai/flows/suggest-team-names';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import { Badge } from './ui/badge';

const createTeamSchema = z.object({
  name: z.string().min(3, 'Team name must be at least 3 characters.').max(50, 'Team name must be at most 50 characters.'),
  sport: z.string().min(1, 'Please select a sport.'),
});

type CreateTeamFormValues = z.infer<typeof createTeamSchema>;

interface CreateTeamDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function CreateTeamDialog({ isOpen, onOpenChange }: CreateTeamDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  
  const form = useForm<CreateTeamFormValues>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: '',
      sport: '',
    },
  });

  const selectedSport = form.watch('sport');

  const handleSuggestNames = async () => {
    if (!selectedSport) {
      toast({ title: 'Select a Sport', description: 'Please select a sport to get name suggestions.', variant: 'destructive' });
      return;
    }
    setIsAiLoading(true);
    setNameSuggestions([]);
    try {
      const result = await suggestTeamNames({ sport: selectedSport });
      setNameSuggestions(result.teamNames);
    } catch (error) {
      console.error('AI Name Suggestion Error:', error);
      toast({ title: 'AI Error', description: 'Could not generate team names.', variant: 'destructive' });
    } finally {
      setIsAiLoading(false);
    }
  };
  
  const applySuggestion = (name: string) => {
    form.setValue('name', name);
    setNameSuggestions([]);
  }

  const onSubmit = async (data: CreateTeamFormValues) => {
    if (!user) {
      toast({ title: 'Authentication Error', description: 'You must be logged in to create a team.', variant: 'destructive' });
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const teamRef = doc(collection(db, 'teams'));
        const memberRef = doc(collection(db, 'teams', teamRef.id, 'members'));

        transaction.set(teamRef, {
          name: data.name,
          sport: data.sport,
          adminIds: [user.uid],
          createdAt: serverTimestamp(),
        });

        transaction.set(memberRef, {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            joinedAt: serverTimestamp(),
        });
      });
      
      toast({ title: 'Team Created!', description: `${data.name} has been successfully created.` });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating team:', error);
      toast({ title: 'Creation Failed', description: 'Could not create the team. Please try again.', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a New Team</DialogTitle>
          <DialogDescription>
            Assemble your squad! Give your team a name and choose your sport to get started.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="sport"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sport</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your team's sport" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sportsList.map(sport => (
                        <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Name</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., The All-Stars" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
                <Button type="button" variant="outline" size="sm" onClick={handleSuggestNames} disabled={isAiLoading || !selectedSport}>
                    {isAiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                    Suggest Names with AI
                </Button>
                {nameSuggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {nameSuggestions.map((name, index) => (
                            <Badge key={index} variant="secondary" className="cursor-pointer hover:bg-primary/20" onClick={() => applySuggestion(name)}>
                                {name}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Team
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
