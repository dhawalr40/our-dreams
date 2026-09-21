'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LetterCard } from '@/components/cards/LetterCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { Plus } from 'lucide-react';
import type { Letter } from '@/types';
import { CreateLetterModal } from './CreateLetterModal';

export default function LettersPage() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  async function loadLetters() {
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
      .from('letters')
      .select('*')
      .eq('world_id', member.world_id)
      .order('created_at', { ascending: false });

    setLetters(data || []);
    setLoading(false);
  }

  useEffect(() => { loadLetters(); }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-[#3d2b2b]">Letters 💌</h1>
          <p className="text-[#8c7b7b] text-sm mt-0.5">Words written with care</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-[#d94f6c] hover:bg-[#c0392b] text-white rounded-full px-4 py-2 text-sm font-semibold transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Write</span>
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-white rounded-3xl animate-pulse border border-[#f0ddd8]" />
          ))}
        </div>
      ) : letters.length === 0 ? (
        <EmptyState
          emoji="💌"
          title="No letters yet..."
          subtitle="Maybe someone should write one 👀"
          action={
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 bg-[#d94f6c] text-white px-5 py-2.5 rounded-full text-sm font-semibold"
            >
              <Plus className="w-4 h-4" />
              Write a letter
            </button>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {letters.map(letter => (
            <LetterCard key={letter.id} letter={letter} />
          ))}
        </div>
      )}

      <CreateLetterModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={loadLetters}
      />
    </div>
  );
}
