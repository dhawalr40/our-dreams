'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MemoryCard } from '@/components/cards/MemoryCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { Memory } from '@/types';

const FILTERS = [
  { id: 'all', label: '✨ All' },
  { id: 'favorites', label: '♡ Favorites' },
  { id: 'romantic', label: '💕 Romantic' },
  { id: 'funny', label: '😂 Funny' },
  { id: 'adventurous', label: '🌟 Adventures' },
  { id: 'happy', label: '😊 Happy' },
];

export default function MemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [filtered, setFiltered] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    async function load() {
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
        .from('memories')
        .select('*, photos:memory_photos(*), tags:memory_tags(tag:tags(*))')
        .eq('world_id', member.world_id)
        .order('date', { ascending: false });

      const mems = (data || []).map(m => ({
        ...m,
        photos: m.photos,
        tags: m.tags?.map((t: { tag: { id: string; name: string } }) => t.tag),
      })) as Memory[];

      setMemories(mems);
      setFiltered(mems);
      setLoading(false);
    }
    load();
  }, []);

  const applyFilters = useCallback(() => {
    let result = memories;

    if (activeFilter !== 'all') {
      if (activeFilter === 'favorites') {
        result = result.filter(m => m.is_favorite);
      } else {
        result = result.filter(m => m.mood === activeFilter);
      }
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(m =>
        m.title.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q) ||
        m.location?.toLowerCase().includes(q) ||
        m.tags?.some(t => t.name.toLowerCase().includes(q))
      );
    }

    setFiltered(result);
  }, [memories, activeFilter, search]);

  useEffect(() => { applyFilters(); }, [applyFilters]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-[#3d2b2b] mb-1">Our Memories 📸</h1>
        <p className="text-[#8c7b7b] text-sm">
          {memories.length} {memories.length === 1 ? 'memory' : 'memories'} and counting
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c7b7b]" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search our memories..."
          className="pl-10 rounded-2xl border-[#f0ddd8] bg-white focus:border-[#d94f6c]"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeFilter === f.id
                ? 'bg-[#d94f6c] text-white'
                : 'bg-white text-[#8c7b7b] border border-[#f0ddd8] hover:border-[#f4b8c1]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square bg-white rounded-2xl animate-pulse border border-[#f0ddd8]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        search || activeFilter !== 'all' ? (
          <EmptyState
            emoji="🔍"
            title="No memories found"
            subtitle="Try a different search or filter"
          />
        ) : (
          <EmptyState
            emoji="📸"
            title="Our little world is waiting for its first memory ♡"
            subtitle="Tap the + button to add your first memory"
          />
        )
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map((memory, i) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              variant="grid"
              rotation={(i % 5) - 2}
            />
          ))}
        </div>
      )}
    </div>
  );
}
