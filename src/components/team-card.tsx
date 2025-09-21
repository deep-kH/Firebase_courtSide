
"use client";

import Link from 'next/link';
import type { Team } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Shield, ArrowRight } from 'lucide-react';

interface TeamCardProps {
  team: Team;
  isAdmin: boolean;
}

const sportIcons: { [key: string]: React.ElementType } = {
  Football: () => <span className="text-2xl">⚽</span>,
  Basketball: () => <span className="text-2xl">🏀</span>,
  Tennis: () => <span className="text-2xl">🎾</span>,
  Swimming: () => <span className="text-2xl">🏊</span>,
  Badminton: () => <span className="text-2xl">🏸</span>,
  Volleyball: () => <span className="text-2xl">🏐</span>,
  'Table Tennis': () => <span className="text-2xl">🏓</span>,
  default: () => <span className="text-2xl">🏆</span>,
};

export function TeamCard({ team, isAdmin }: TeamCardProps) {
  const Icon = sportIcons[team.sport] || sportIcons.default;
  return (
    <Link href={`/dashboard/teams/${team.id}`} className="group block">
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 h-full flex flex-col">
        <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-4">
            <div className="bg-muted p-3 rounded-lg flex items-center justify-center">
                <Icon />
            </div>
            <div className="flex-1">
                <CardTitle className="text-xl font-bold font-headline">{team.name}</CardTitle>
                <CardDescription>{team.sport}</CardDescription>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
        </CardHeader>
        <CardContent className="flex-grow flex items-end justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{team.memberCount || 0} Members</span>
            </div>
            {isAdmin && (
                <Badge variant="outline" className="text-primary border-primary/50">
                   <Shield className="mr-1.5 h-3.5 w-3.5" /> Admin
                </Badge>
            )}
        </CardContent>
      </Card>
    </Link>
  );
}
