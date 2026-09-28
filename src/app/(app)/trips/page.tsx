'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { TripCard } from '@/components/cards/TripCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { Plus } from 'lucide-react';
import { type Trip } from '@/types';
import { CreateTripModal } from './CreateTripModal';

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  async function loadTrips() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: member } = await supabase
      .from('world_members')
      .select('world_id')
      .eq('user_id', user.id)
      .order('role', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!member) { setLoading(false); return; }

    const { data } = await supabase
      .from('trips')
      .select('*, memory_count:memories(count)')
      .eq('world_id', member.world_id)
      .order('start_date', { ascending: true });

    const tripsWithCount = (data || []).map(t => ({
      ...t,
      memory_count: t.memory_count?.[0]?.count ?? 0,
    }));

    setTrips(tripsWithCount);
    setLoading(false);
  }

  useEffect(() => { loadTrips(); }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-[#3d2b2b]">Our Trips ✈️</h1>
          <p className="text-[#8c7b7b] text-sm mt-0.5">Every adventure we&apos;ve taken together</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-[#d94f6c] hover:bg-[#c0392b] text-white rounded-full px-4 py-2 text-sm font-semibold transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New trip</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-white rounded-3xl animate-pulse border border-[#f0ddd8]" />
          ))}
        </div>
      ) : trips.length === 0 ? (
        <EmptyState
          emoji="✈️"
          title="Every adventure starts somewhere..."
          subtitle="You haven't added any trips yet. Where should we go?"
          action={
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 bg-[#d94f6c] text-white px-5 py-2.5 rounded-full text-sm font-semibold"
            >
              <Plus className="w-4 h-4" />
              Start a new adventure
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}

      <CreateTripModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={loadTrips}
      />
    </div>
  );
}
