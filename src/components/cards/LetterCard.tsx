'use client';

import Link from 'next/link';
import { type Letter } from '@/types';
import { formatDate } from '@/lib/utils';
import { Lock, Unlock } from 'lucide-react';

interface LetterCardProps {
  letter: Letter;
}

export function LetterCard({ letter }: LetterCardProps) {
  const isLocked = letter.is_locked && letter.open_date
    ? new Date(letter.open_date) > new Date()
    : false;

  return (
    <Link
      href={isLocked ? '#' : `/letters/${letter.id}`}
      className={`block group ${isLocked ? 'cursor-default' : ''}`}
    >
      <div className="relative bg-white rounded-3xl border border-[#f0ddd8] shadow-sm hover:shadow-md transition-all overflow-hidden group-hover:-translate-y-0.5">
        {/* Envelope flap */}
        <div className="h-16 bg-[#fde8e8] relative overflow-hidden">
          <div
            className="absolute top-0 left-0 right-0 h-16"
            style={{
              background: 'linear-gradient(135deg, transparent 50%, #f4b8c1 50%)',
            }}
          />
          <div className="absolute top-2 right-3">
            {isLocked ? (
              <Lock className="w-4 h-4 text-[#d94f6c]" />
            ) : (
              <Unlock className="w-4 h-4 text-[#8c7b7b]" />
            )}
          </div>
          {/* Heart seal */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-7 h-7 bg-[#d94f6c] rounded-full flex items-center justify-center shadow-sm z-10 text-white text-sm">
            ♡
          </div>
        </div>

        {/* Letter content */}
        <div className="px-4 pt-6 pb-4">
          <h3 className="font-display text-lg text-[#3d2b2b] mb-1 leading-tight">
            {letter.title}
          </h3>

          {letter.open_condition && (
            <p className="text-xs text-[#d94f6c] font-medium mb-2 bg-[#fde8e8] px-2 py-1 rounded-full inline-block">
              💌 {letter.open_condition}
            </p>
          )}

          {isLocked ? (
            <p className="text-xs text-[#8c7b7b] italic">
              Opens on {formatDate(letter.open_date!)}
            </p>
          ) : (
            <p className="text-sm text-[#8c7b7b] line-clamp-2 leading-relaxed">
              {letter.body.substring(0, 100)}...
            </p>
          )}

          <p className="text-xs text-[#8c7b7b] mt-3">
            {formatDate(letter.created_at)}
          </p>
        </div>
      </div>
    </Link>
  );
}
