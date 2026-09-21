'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Plus, Calendar, MapPin, Heart, Plane, Star, Cake } from 'lucide-react';
import { formatDate, daysTogether, formatNumber } from '@/lib/utils';
import type { TimelineEvent, WorldStats, World } from '@/types';
import { AddEventModal } from './AddEventModal';

const EVENT_ICONS: Record<string, React.ReactNode> = {
  milestone: <Heart className="w-4 h-4 text-[#d94f6c]" />,
  trip: <Plane className="w-4 h-4 text-[#d94f6c]" />,
  birthday: <Cake className="w-4 h-4 text-[#d94f6c]" />,
  anniversary: <Star className="w-4 h-4 text-[#d94f6c]" />,
  date: <Calendar className="w-4 h-4 text-[#d94f6c]" />,
  custom: <Heart className="w-4 h-4 text-[#d94f6c]" />,
};

export default function UsPage() {
  const [world, setWorld] = useState<World | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [stats, setStats] = useState<WorldStats>({
    days_together: 0,
    trip_count: 0,
    memory_count: 0,
    letter_count: 0,
    photo_count: 0,
    place_count: 0,
    favorite_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showAddEvent, setShowAddEvent] = useState(false);

  async function loadData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: member } = await supabase
      .from('world_members')
      .select('world_id, worlds(*)')
      .eq('user_id', user.id)
      .order('role', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!member) { setLoading(false); return; }

    const worldData = member.worlds as unknown as World;
    const worldId = member.world_id;
    setWorld(worldData);

    const [
      { data: eventsData },
      { count: tripCount },
      { count: memoryCount },
      { count: letterCount },
      { count: favoriteCount },
    ] = await Promise.all([
      supabase.from('timeline_events').select('*').eq('world_id', worldId).order('date', { ascending: true }),
      supabase.from('trips').select('*', { count: 'exact', head: true }).eq('world_id', worldId),
      supabase.from('memories').select('*', { count: 'exact', head: true }).eq('world_id', worldId),
      supabase.from('letters').select('*', { count: 'exact', head: true }).eq('world_id', worldId),
      supabase.from('memories').select('*', { count: 'exact', head: true }).eq('world_id', worldId).eq('is_favorite', true),
    ]);

    setEvents(eventsData || []);
    setStats({
      days_together: worldData.anniversary_date ? daysTogether(worldData.anniversary_date) : 0,
      trip_count: tripCount ?? 0,
      memory_count: memoryCount ?? 0,
      letter_count: letterCount ?? 0,
      photo_count: 0,
      place_count: 0,
      favorite_count: favoriteCount ?? 0,
    });
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  // Group events by year
  const eventsByYear = events.reduce((acc, event) => {
    const year = new Date(event.date).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(event);
    return acc;
  }, {} as Record<number, TimelineEvent[]>);

  const years = Object.keys(eventsByYear).map(Number).sort((a, b) => a - b);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-[#3d2b2b]">Us 💗</h1>
        <p className="text-[#8c7b7b] text-sm mt-0.5">Our story, written in little moments</p>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-3xl border border-[#f0ddd8] p-5 mb-6 shadow-sm">
        <div className="text-center mb-4">
          <div className="font-display text-4xl text-[#d94f6c]">{formatNumber(stats.days_together)}</div>
          <div className="text-[#8c7b7b] text-sm">days together ❤️</div>
          {world?.anniversary_date && (
            <div className="text-xs text-[#8c7b7b] mt-1">Since {formatDate(world.anniversary_date)}</div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="font-display text-xl text-[#3d2b2b]">{formatNumber(stats.trip_count)}</div>
            <div className="text-[10px] text-[#8c7b7b]">✈️ adventures</div>
          </div>
          <div>
            <div className="font-display text-xl text-[#3d2b2b]">{formatNumber(stats.memory_count)}</div>
            <div className="text-[10px] text-[#8c7b7b]">📸 memories</div>
          </div>
          <div>
            <div className="font-display text-xl text-[#3d2b2b]">{formatNumber(stats.letter_count)}</div>
            <div className="text-[10px] text-[#8c7b7b]">💌 letters</div>
          </div>
        </div>
        <p className="text-center text-[#d94f6c] text-xs mt-3 font-medium">Still counting ♡</p>
      </div>

      {/* Timeline header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-2xl text-[#3d2b2b]">Our Story</h2>
        <button
          onClick={() => setShowAddEvent(true)}
          className="flex items-center gap-1.5 bg-[#d94f6c] hover:bg-[#c0392b] text-white rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Add milestone
        </button>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-6 w-16 bg-[#f0ddd8] rounded animate-pulse" />
              <div className="h-16 bg-white rounded-2xl animate-pulse border border-[#f0ddd8]" />
              <div className="h-16 bg-white rounded-2xl animate-pulse border border-[#f0ddd8]" />
            </div>
          ))}
        </div>
      ) : years.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📖</div>
          <p className="text-[#3d2b2b] font-semibold mb-1">Your story is just beginning</p>
          <p className="text-[#8c7b7b] text-sm mb-4">Add your first milestone ♡</p>
          <button
            onClick={() => setShowAddEvent(true)}
            className="inline-flex items-center gap-2 bg-[#d94f6c] text-white px-5 py-2.5 rounded-full text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            Add a milestone
          </button>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-[#f0ddd8]" />

          <div className="space-y-8">
            {years.map(year => (
              <div key={year}>
                {/* Year label */}
                <div className="relative flex items-center gap-3 mb-4">
                  <div className="relative z-10 w-10 h-10 bg-[#d94f6c] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {year}
                  </div>
                  <div className="font-display text-xl text-[#3d2b2b]">{year}</div>
                </div>

                {/* Events in this year */}
                <div className="ml-14 space-y-3">
                  {eventsByYear[year].map(event => (
                    <div
                      key={event.id}
                      className="bg-white rounded-2xl border border-[#f0ddd8] p-4 shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 bg-[#fde8e8] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          {event.emoji ? (
                            <span className="text-sm">{event.emoji}</span>
                          ) : (
                            EVENT_ICONS[event.type] || <Heart className="w-4 h-4 text-[#d94f6c]" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-[#3d2b2b] text-sm">{event.title}</p>
                          {event.description && (
                            <p className="text-xs text-[#8c7b7b] mt-0.5">{event.description}</p>
                          )}
                          <p className="text-xs text-[#8c7b7b] mt-1">{formatDate(event.date)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AddEventModal
        open={showAddEvent}
        onClose={() => setShowAddEvent(false)}
        onCreated={loadData}
      />
    </div>
  );
}
