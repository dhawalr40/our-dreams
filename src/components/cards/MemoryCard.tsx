'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Calendar, Heart } from 'lucide-react';
import { type Memory } from '@/types';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface MemoryCardProps {
  memory: Memory;
  variant?: 'grid' | 'featured' | 'compact';
  rotation?: number;
}

const rotations = [-2, -1, 0, 1, 2];

export function MemoryCard({ memory, variant = 'grid', rotation }: MemoryCardProps) {
  const [favorite, setFavorite] = useState(memory.is_favorite);
  const rot = rotation ?? rotations[Math.floor(Math.random() * rotations.length)];
  const coverPhoto = memory.photos?.[0]?.url;

  if (variant === 'featured') {
    return (
      <Link href={`/memories/${memory.id}`} className="block group">
        <div className="polaroid rounded-sm overflow-hidden transition-transform group-hover:-translate-y-1">
          <div className="relative aspect-[4/3] bg-[#f5ede3] rounded-sm overflow-hidden">
            {coverPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverPhoto}
                alt={memory.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">
                📸
              </div>
            )}
            {favorite && (
              <div className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-sm">
                <Heart className="w-4 h-4 text-[#d94f6c] fill-[#d94f6c]" />
              </div>
            )}
          </div>
          <div className="pt-3 pb-1 px-1">
            <h3 className="font-semibold text-[#3d2b2b] text-base leading-tight mb-1 line-clamp-1">
              {memory.title}
            </h3>
            <div className="flex items-center gap-3 text-xs text-[#8c7b7b]">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(memory.date)}
              </span>
              {memory.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {memory.location}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link href={`/memories/${memory.id}`} className="block group">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-[#f0ddd8] hover:border-[#f4b8c1] transition-all">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#f5ede3] flex-shrink-0">
            {coverPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverPhoto} alt={memory.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl">📸</div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-[#3d2b2b] text-sm truncate">{memory.title}</p>
            <p className="text-xs text-[#8c7b7b] mt-0.5">{formatDate(memory.date)}</p>
          </div>
          {favorite && <Heart className="w-3.5 h-3.5 text-[#d94f6c] fill-[#d94f6c] ml-auto flex-shrink-0" />}
        </div>
      </Link>
    );
  }

  // Grid variant — polaroid style
  return (
    <Link href={`/memories/${memory.id}`} className="block group">
      <div
        className={cn(
          'polaroid rounded-sm transition-all group-hover:scale-105 group-hover:shadow-lg cursor-pointer',
        )}
        style={{ transform: `rotate(${rot}deg)` }}
      >
        <div className="relative aspect-square bg-[#f5ede3] rounded-sm overflow-hidden">
          {coverPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverPhoto}
              alt={memory.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl opacity-30">📸</span>
            </div>
          )}
          <button
            onClick={(e) => { e.preventDefault(); setFavorite(!favorite); }}
            className="absolute top-2 right-2 w-7 h-7 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-sm transition-all"
            aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={cn('w-3.5 h-3.5', favorite ? 'text-[#d94f6c] fill-[#d94f6c]' : 'text-[#8c7b7b]')} />
          </button>
        </div>
        <div className="pt-2 pb-0.5">
          <p className="font-semibold text-[#3d2b2b] text-xs leading-tight line-clamp-1 mb-0.5">
            {memory.title}
          </p>
          <p className="text-[10px] text-[#8c7b7b]">{formatDate(memory.date)}</p>
          {memory.location && (
            <p className="text-[10px] text-[#8c7b7b] flex items-center gap-0.5 mt-0.5">
              <MapPin className="w-2.5 h-2.5" />
              {memory.location}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
