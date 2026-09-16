'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, MapPin, Calendar, Heart, Tag } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { MOOD_LABELS, type Memory, type Mood } from '@/types';
import { EmptyState } from '@/components/shared/EmptyState';

export default function MemoryDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [memory, setMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('memories')
        .select('*, photos:memory_photos(*), tags:memory_tags(tag:tags(*)), creator:users!created_by(display_name)')
        .eq('id', id)
        .single();

      if (data) {
        const mem = {
          ...data,
          photos: data.photos,
          tags: data.tags?.map((t: { tag: { id: string; name: string } }) => t.tag),
        } as Memory;
        setMemory(mem);
        setFavorite(mem.is_favorite);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function toggleFavorite() {
    if (!memory) return;
    const supabase = createClient();
    const newVal = !favorite;
    setFavorite(newVal);
    await supabase.from('memories').update({ is_favorite: newVal }).eq('id', memory.id);
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <div className="h-72 bg-[#f0ddd8] rounded-3xl animate-pulse" />
        <div className="h-8 w-48 bg-[#f0ddd8] rounded-full animate-pulse" />
        <div className="h-4 w-32 bg-[#f0ddd8] rounded-full animate-pulse" />
      </div>
    );
  }

  if (!memory) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <EmptyState emoji="🎀" title="Memory not found" subtitle="This memory doesn't exist." />
      </div>
    );
  }

  const photos = memory.photos || [];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Photo viewer */}
      {photos.length > 0 && (
        <div className="relative">
          <div className="aspect-[4/3] overflow-hidden bg-[#f5ede3]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[activePhoto].url}
              alt={memory.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Photo navigation */}
          {photos.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActivePhoto(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === activePhoto ? 'bg-white w-4' : 'bg-white/50'
                  }`}
                  aria-label={`View photo ${i + 1}`}
                />
              ))}
            </div>
          )}

          {/* Back button */}
          <Link
            href="/memories"
            className="absolute top-4 left-4 flex items-center gap-1.5 bg-white/90 hover:bg-white text-[#3d2b2b] px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Memories
          </Link>

          {/* Favorite button */}
          <button
            onClick={toggleFavorite}
            className="absolute top-4 right-4 w-9 h-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-sm transition-all"
            aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-4 h-4 ${favorite ? 'text-[#d94f6c] fill-[#d94f6c]' : 'text-[#8c7b7b]'}`} />
          </button>
        </div>
      )}

      <div className="px-4 py-6 space-y-4">
        {/* Title area */}
        {photos.length === 0 && (
          <Link
            href="/memories"
            className="inline-flex items-center gap-1.5 text-[#d94f6c] text-sm font-medium mb-4 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to memories
          </Link>
        )}

        <div>
          <h1 className="font-display text-3xl text-[#3d2b2b] leading-tight">{memory.title}</h1>

          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-[#8c7b7b]">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#d94f6c]" />
              {formatDate(memory.date)}
            </span>
            {memory.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#d94f6c]" />
                {memory.location}
              </span>
            )}
            {memory.mood && (
              <span className="px-2 py-0.5 bg-[#fde8e8] text-[#d94f6c] rounded-full text-xs font-medium">
                {MOOD_LABELS[memory.mood as Mood]}
              </span>
            )}
          </div>
        </div>

        {memory.description && (
          <p className="text-[#3d2b2b]/80 leading-relaxed">{memory.description}</p>
        )}

        {/* Tags */}
        {memory.tags && memory.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {memory.tags.map(tag => (
              <span
                key={tag.id}
                className="flex items-center gap-1 px-3 py-1 bg-[#faf6f1] border border-[#f0ddd8] text-[#8c7b7b] rounded-full text-xs font-medium"
              >
                <Tag className="w-3 h-3" />
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Photo grid if multiple */}
        {photos.length > 1 && (
          <div>
            <h3 className="font-semibold text-[#3d2b2b] text-sm mb-3">Photos</h3>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo, i) => (
                <button
                  key={photo.id}
                  onClick={() => setActivePhoto(i)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    i === activePhoto ? 'border-[#d94f6c]' : 'border-transparent'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Favorite button */}
        <button
          onClick={toggleFavorite}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl border transition-all font-medium text-sm ${
            favorite
              ? 'bg-[#fde8e8] border-[#f4b8c1] text-[#d94f6c]'
              : 'bg-white border-[#f0ddd8] text-[#8c7b7b] hover:border-[#f4b8c1] hover:text-[#d94f6c]'
          }`}
        >
          <Heart className={`w-4 h-4 ${favorite ? 'fill-[#d94f6c]' : ''}`} />
          {favorite ? '♡ This memory means a lot' : 'Mark as favorite ♡'}
        </button>
      </div>
    </div>
  );
}
