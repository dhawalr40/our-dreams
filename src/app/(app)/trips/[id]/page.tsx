'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { MemoryCard } from '@/components/cards/MemoryCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { AddMemoryModal } from '@/components/shared/AddMemoryModal';
import { formatDate, formatDateShort } from '@/lib/utils';
import { ArrowLeft, MapPin, Calendar, Plus, Camera } from 'lucide-react';
import type { Trip, Memory } from '@/types';

export default function TripDetailPage() {
  const params = useParams();
  const tripId = params.id as string;
  const [trip, setTrip] = useState<Trip | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingMemory, setAddingMemory] = useState(false);

  async function loadTrip() {
    const supabase = createClient();

    const [{ data: tripData }, { data: memoryData }] = await Promise.all([
      supabase.from('trips').select('*').eq('id', tripId).single(),
      supabase.from('memories')
        .select('*, photos:memory_photos(*)')
        .eq('trip_id', tripId)
        .order('date', { ascending: true }),
    ]);

    setTrip(tripData);
    setMemories((memoryData || []).map(m => ({ ...m, photos: m.photos })) as Memory[]);
    setLoading(false);
  }

  useEffect(() => { loadTrip(); }, [tripId]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="h-64 bg-[#f0ddd8] rounded-3xl animate-pulse mb-6" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-square bg-white rounded-3xl animate-pulse border border-[#f0ddd8]" />
          ))}
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <EmptyState emoji="🎀" title="Trip not found" subtitle="This trip doesn't exist or you don't have access." />
      </div>
    );
  }

  const coverStyle = trip.cover_photo_url
    ? { backgroundImage: `url(${trip.cover_photo_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};

  return (
    <div className="max-w-2xl mx-auto">
      {/* Hero cover */}
      <div className="relative h-64 sm:h-80 bg-gradient-to-br from-rose-400 to-pink-600" style={coverStyle}>
        <div className="absolute inset-0 bg-black/40" />

        {/* Back button */}
        <Link
          href="/trips"
          className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-white/90 hover:bg-white text-[#3d2b2b] px-3 py-1.5 rounded-full text-sm font-semibold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Trips
        </Link>

        {/* Trip info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h1 className="font-display text-3xl font-bold mb-1">{trip.title}</h1>
          {trip.description && (
            <p className="text-white/80 text-sm mb-2 italic">&ldquo;{trip.description}&rdquo;</p>
          )}
          <div className="flex items-center gap-4 text-sm text-white/80">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDateShort(trip.start_date)}
              {trip.end_date && ` — ${formatDateShort(trip.end_date)}`}
            </span>
            {trip.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {trip.location}
              </span>
            )}
          </div>
        </div>

        {/* Photo corner decorations */}
        <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-white/40 rounded-tr" />
        <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-white/40 rounded-bl" />
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Memories count + add button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl text-[#3d2b2b]">Memories</h2>
            <p className="text-[#8c7b7b] text-sm">
              {memories.length} {memories.length === 1 ? 'memory' : 'memories'} from this trip
            </p>
          </div>
          <button
            onClick={() => setAddingMemory(true)}
            className="flex items-center gap-2 bg-[#d94f6c] hover:bg-[#c0392b] text-white rounded-full px-4 py-2 text-sm font-semibold transition-all"
          >
            <Plus className="w-4 h-4" />
            Add memory
          </button>
        </div>

        {memories.length === 0 ? (
          <EmptyState
            emoji="📸"
            title="No memories from this trip yet"
            subtitle="Add your first memory from this adventure!"
            action={
              <button
                onClick={() => setAddingMemory(true)}
                className="inline-flex items-center gap-2 bg-[#d94f6c] text-white px-5 py-2.5 rounded-full text-sm font-semibold"
              >
                <Camera className="w-4 h-4" />
                Add first memory
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {memories.map((memory, i) => (
              <MemoryCard key={memory.id} memory={memory} variant="featured" rotation={i % 2 === 0 ? -1 : 1} />
            ))}
          </div>
        )}
      </div>

      <AddMemoryModal
        open={addingMemory}
        onClose={() => setAddingMemory(false)}
        tripId={tripId}
      />
    </div>
  );
}
