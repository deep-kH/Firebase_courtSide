"use client";

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { facilities as allFacilities } from '@/lib/data';
import type { Facility } from '@/lib/types';
import { FacilityCard } from '@/components/facility-card';
import { Search } from 'lucide-react';

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFacilities = useMemo(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    if (!lowercasedQuery) {
      return allFacilities;
    }
    return allFacilities.filter((facility: Facility) =>
      facility.name.toLowerCase().includes(lowercasedQuery) ||
      facility.type.toLowerCase().includes(lowercasedQuery) ||
      facility.sports.some(sport => sport.toLowerCase().includes(lowercasedQuery))
    );
  }, [searchQuery]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight font-headline">Find a Facility</h1>
          <p className="text-muted-foreground">Browse and book available courts and fields.</p>
        </div>
        <div className="relative w-full sm:w-64 md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name, type, or sport..."
            className="w-full pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredFacilities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredFacilities.map((facility) => (
            <FacilityCard key={facility.id} facility={facility} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <h3 className="text-xl font-semibold">No Facilities Found</h3>
          <p className="text-muted-foreground mt-2">Try adjusting your search query.</p>
        </div>
      )}
    </div>
  );
}
