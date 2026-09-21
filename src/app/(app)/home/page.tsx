'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { MemoryCard } from '@/components/cards/MemoryCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { daysTogether, formatDate, formatNumber } from '@/lib/utils';
import { Camera, Plane, Mail, Heart, MapPin, Sparkles, Calendar } from 'lucide-react';
import type { Memory, WorldStats, World, Memory as MemoryType } from '@/types';

interface HomeData {
  world: World | null;
  stats: WorldStats;
  latestMemory: Memory | null;
  onThisDay: Memory | null;
  recentMemories: Memory[];
}

export default function HomePage() {
  const [data, setData] = useState<HomeData>({
    world: null,
    stats: {
      days_together: 0,
      trip_count: 0,
      memory_count: 0,
      letter_count: 0,
      photo_count: 0,
      place_count: 0,
      favorite_count: 0,
    },
    latestMemory: null,
    onThisDay: null,
    recentMemories: [],
  });
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserName(user.user_metadata?.display_name || user.email?.split('@')[0] || 'love');

      // Get world
      const { data: member } = await supabase
        .from('world_members')
        .select('world_id, worlds(*)')
        .eq('user_id', user.id)
        .order('role', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!member) {
        setLoading(false);
        return;
      }

      const world = member.worlds as unknown as World;
      const worldId = member.world_id;

      // Fetch stats in parallel
      const [
        { count: tripCount },
        { count: memoryCount },
        { count: letterCount },
        { count: photoCount },
        { count: favoriteCount },
        { data: memories },
        { data: onThisDayMemory },
      ] = await Promise.all([
        supabase.from('trips').select('*', { count: 'exact', head: true }).eq('world_id', worldId),
        supabase.from('memories').select('*', { count: 'exact', head: true }).eq('world_id', worldId),
        supabase.from('letters').select('*', { count: 'exact', head: true }).eq('world_id', worldId),
        supabase.from('memory_photos').select('memories!inner(world_id)', { count: 'exact', head: true }).eq('memories.world_id', worldId),
        supabase.from('memories').select('*', { count: 'exact', head: true }).eq('world_id', worldId).eq('is_favorite', true),
        supabase.from('memories')
          .select('*, photos:memory_photos(*)')
          .eq('world_id', worldId)
          .order('date', { ascending: false })
          .limit(6),
        supabase.from('memories')
          .select('*, photos:memory_photos(*)')
          .eq('world_id', worldId)
          .filter('date', 'like', `%-${new Date().toISOString().slice(5, 10)}`)
          .not('date', 'like', `${new Date().getFullYear()}%`)
          .order('date', { ascending: false })
          .limit(1),
      ]);

      const daysCount = world.anniversary_date ? daysTogether(world.anniversary_date) : 0;

      setData({
        world,
        stats: {
          days_together: daysCount,
          trip_count: tripCount ?? 0,
          memory_count: memoryCount ?? 0,
          letter_count: letterCount ?? 0,
          photo_count: photoCount ?? 0,
          place_count: 0,
          favorite_count: favoriteCount ?? 0,
        },
        latestMemory: memories?.[0] ? { ...memories[0], photos: memories[0].photos } as MemoryType : null,
        onThisDay: onThisDayMemory?.[0] ? { ...onThisDayMemory[0], photos: onThisDayMemory[0].photos } as MemoryType : null,
        recentMemories: (memories?.slice(1, 5) || []).map(m => ({ ...m, photos: m.photos })) as MemoryType[],
      });

      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return <HomeLoading />;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      {/* Hero */}
      <section className="text-center pt-4">
        <div className="text-3xl mb-3 select-none">🎀</div>
        <h1 className="font-display text-4xl md:text-5xl text-[#3d2b2b] mb-2">
          {data.world?.name || 'Our Little World'}
        </h1>
        <p className="text-[#8c7b7b] text-sm">
          {data.world?.tagline || 'a tiny place for all our favorite things'}
        </p>
        <p className="text-[#d94f6c] text-sm font-medium mt-1">
          Welcome back, {userName} ♡
        </p>
      </section>

      {/* Stats */}
      <section>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            value={formatNumber(data.stats.days_together)}
            label="days together"
            icon="❤️"
          />
          <StatCard
            value={formatNumber(data.stats.memory_count)}
            label="little memories"
            icon="📸"
          />
          <StatCard
            value={formatNumber(data.stats.trip_count)}
            label="adventures"
            icon="✈️"
          />
          <StatCard
            value={formatNumber(data.stats.letter_count)}
            label="love letters"
            icon="💌"
          />
        </div>
        <p className="text-center text-[#8c7b7b] text-xs mt-3">
          and we&apos;re still counting... ♡
        </p>
      </section>

      {/* Latest memory */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl text-[#3d2b2b]">Our Latest Memory</h2>
          <Link href="/memories" className="text-[#d94f6c] text-sm font-medium hover:underline">
            See all →
          </Link>
        </div>

        {data.latestMemory ? (
          <div className="relative">
            {/* Washi tape */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-[#f4b8c1]/60 rounded-sm -rotate-1 z-10" />
            <Link href={`/memories/${data.latestMemory.id}`} className="block">
              <div className="bg-white rounded-3xl border border-[#f0ddd8] shadow-sm overflow-hidden hover:shadow-md transition-all">
                {data.latestMemory.photos?.[0] && (
                  <div className="aspect-[16/9] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={data.latestMemory.photos[0].url}
                      alt={data.latestMemory.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-5">
                  <h3 className="font-display text-xl text-[#3d2b2b] mb-1">{data.latestMemory.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-[#8c7b7b] mb-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(data.latestMemory.date)}
                    </span>
                    {data.latestMemory.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {data.latestMemory.location}
                      </span>
                    )}
                  </div>
                  {data.latestMemory.description && (
                    <p className="text-sm text-[#8c7b7b] line-clamp-2">{data.latestMemory.description}</p>
                  )}
                </div>
              </div>
            </Link>
          </div>
        ) : (
          <EmptyState
            emoji="📸"
            title="No memories yet"
            subtitle="Our little world is waiting for its first memory ♡"
            action={
              <Link
                href="/memories"
                className="inline-flex items-center gap-2 bg-[#d94f6c] text-white px-4 py-2 rounded-full text-sm font-semibold"
              >
                Add our first memory
              </Link>
            }
          />
        )}
      </section>

      {/* On This Day */}
      {data.onThisDay && (
        <section>
          <h2 className="font-display text-2xl text-[#3d2b2b] mb-4">On This Day... 🌸</h2>
          <div className="bg-[#fde8e8]/60 rounded-3xl border border-[#f4b8c1]/40 p-4">
            <p className="text-xs text-[#d94f6c] font-semibold mb-2">
              {new Date().getFullYear() - new Date(data.onThisDay.date).getFullYear()} year{
                new Date().getFullYear() - new Date(data.onThisDay.date).getFullYear() !== 1 ? 's' : ''
              } ago today...
            </p>
            <MemoryCard memory={data.onThisDay} variant="compact" />
          </div>
        </section>
      )}

      {/* Recent memories grid */}
      {data.recentMemories.length > 0 && (
        <section>
          <h2 className="font-display text-2xl text-[#3d2b2b] mb-4">Recent Moments</h2>
          <div className="grid grid-cols-2 gap-4">
            {data.recentMemories.map((m, i) => (
              <MemoryCard key={m.id} memory={m} variant="featured" rotation={i % 2 === 0 ? -1 : 1} />
            ))}
          </div>
        </section>
      )}

      {/* Quick links */}
      <section>
        <h2 className="font-display text-2xl text-[#3d2b2b] mb-4">Explore</h2>
        <div className="grid grid-cols-2 gap-3">
          <QuickLink href="/trips" emoji="✈️" label="Our Trips" sub="Every adventure" />
          <QuickLink href="/letters" emoji="💌" label="Love Letters" sub="Written with care" />
          <QuickLink href="/us" emoji="💗" label="Our Story" sub="How it all began" />
          <QuickLink href="/future" emoji="✨" label="Future Memories" sub="What's next for us" />
        </div>
      </section>

      {/* Spacer for bottom nav */}
      <div className="h-4" />
    </div>
  );
}

function StatCard({ value, label, icon }: { value: string; label: string; icon: string }) {
  return (
    <div className="bg-white rounded-3xl border border-[#f0ddd8] p-4 text-center shadow-sm">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="font-display text-2xl text-[#3d2b2b] font-bold">{value}</div>
      <div className="text-xs text-[#8c7b7b] font-medium mt-0.5">{label}</div>
    </div>
  );
}

function QuickLink({ href, emoji, label, sub }: { href: string; emoji: string; label: string; sub: string }) {
  return (
    <Link href={href} className="block group">
      <div className="bg-white rounded-3xl border border-[#f0ddd8] p-4 hover:border-[#f4b8c1] hover:shadow-sm transition-all">
        <div className="text-2xl mb-2">{emoji}</div>
        <div className="font-semibold text-[#3d2b2b] text-sm">{label}</div>
        <div className="text-xs text-[#8c7b7b] mt-0.5">{sub}</div>
      </div>
    </Link>
  );
}

function HomeLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <div className="text-center pt-4">
        <div className="h-8 w-48 bg-[#f0ddd8] rounded-full mx-auto mb-3 animate-pulse" />
        <div className="h-4 w-32 bg-[#f0ddd8] rounded-full mx-auto animate-pulse" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-3xl border border-[#f0ddd8] p-4 h-24 animate-pulse" />
        ))}
      </div>
      <div className="bg-white rounded-3xl border border-[#f0ddd8] h-48 animate-pulse" />
    </div>
  );
}
