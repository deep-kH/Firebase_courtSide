"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { Facility } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

interface FacilityCardProps {
  facility: Facility;
}

export function FacilityCard({ facility }: FacilityCardProps) {
  const placeholder = PlaceHolderImages.find(p => p.id === facility.image);
  
  const statusVariant = {
    'Available': 'default',
    'Maintenance': 'secondary',
    'Closed': 'destructive',
  }[facility.status] || 'default';


  return (
    <Link href={`/dashboard/schedule/${facility.id}`} className="group block">
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <CardHeader className="p-0">
          <div className="relative h-48 w-full">
            <Image
              src={placeholder?.imageUrl || "https://picsum.photos/seed/placeholder/600/400"}
              alt={facility.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={placeholder?.imageHint || 'sports facility'}
            />
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
             <Badge 
                variant={statusVariant as any}
                className="absolute top-3 right-3"
              >
                {facility.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4">
            <div className='flex justify-between items-start'>
                <div>
                    <p className="text-sm font-medium text-primary">{facility.type}</p>
                    <CardTitle className="text-lg font-bold font-headline mt-1">{facility.name}</CardTitle>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {facility.sports.map((sport) => (
                        <Badge key={sport} variant="outline">{sport}</Badge>
                        ))}
                    </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                     <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
            </div>
        </CardContent>
      </Card>
    </Link>
  );
}
