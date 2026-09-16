'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Lock } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Letter } from '@/types';

export default function LetterDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [letter, setLetter] = useState<Letter | null>(null);
  const [loading, setLoading] = useState(true);
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('letters')
        .select('*')
        .eq('id', id)
        .single();
      setLetter(data);
      setLoading(false);
    }
    load();
  }, [id]);

  const isLocked = letter?.is_locked && letter?.open_date
    ? new Date(letter.open_date) > new Date()
    : false;

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="h-96 bg-white rounded-3xl animate-pulse border border-[#f0ddd8]" />
      </div>
    );
  }

  if (!letter) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 text-center">
        <div className="text-5xl mb-4">💌</div>
        <p className="text-[#8c7b7b]">Letter not found</p>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 text-center">
        <Link href="/letters" className="inline-flex items-center gap-1.5 text-[#d94f6c] text-sm font-medium mb-8 hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Back to letters
        </Link>
        <div className="bg-white rounded-3xl border border-[#f0ddd8] p-8 shadow-sm">
          <div className="text-5xl mb-4">🔒</div>
          <Lock className="w-8 h-8 text-[#d94f6c] mx-auto mb-3" />
          <h2 className="font-display text-2xl text-[#3d2b2b] mb-2">{letter.title}</h2>
          <p className="text-[#8c7b7b] text-sm">
            This letter opens on {formatDate(letter.open_date!)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <Link href="/letters" className="inline-flex items-center gap-1.5 text-[#d94f6c] text-sm font-medium mb-6 hover:underline">
        <ArrowLeft className="w-4 h-4" />
        Back to letters
      </Link>

      {/* Letter paper */}
      <div className="relative">
        {/* Washi tape */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-24 h-5 bg-[#f4b8c1]/50 rounded-sm -rotate-1 z-10" />

        <div className="bg-white rounded-3xl border border-[#f0ddd8] shadow-md overflow-hidden">
          {/* Letter header decoration */}
          <div className="h-2 bg-gradient-to-r from-[#f4b8c1] via-[#d94f6c] to-[#f4b8c1]" />

          <div className="p-8">
            <div className="text-center mb-6">
              <div className="text-3xl mb-2">💌</div>
              <h1 className="font-display text-2xl text-[#3d2b2b]">{letter.title}</h1>
              {letter.recipient && (
                <p className="text-[#8c7b7b] text-sm mt-1">For: {letter.recipient}</p>
              )}
              {letter.open_condition && (
                <span className="inline-block mt-2 px-3 py-1 bg-[#fde8e8] text-[#d94f6c] text-xs font-medium rounded-full">
                  {letter.open_condition}
                </span>
              )}
            </div>

            {/* Letter body */}
            <div className="prose prose-sm max-w-none">
              <div
                className="text-[#3d2b2b] leading-relaxed whitespace-pre-wrap font-[inherit] text-base"
                style={{ fontFamily: 'inherit' }}
              >
                {letter.body}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-[#f0ddd8] text-center">
              <p className="text-[#8c7b7b] text-xs">Written {formatDate(letter.created_at)}</p>
              <div className="text-[#d94f6c] mt-2">♡</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
