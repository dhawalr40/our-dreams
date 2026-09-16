'use client';

import Link from 'next/link';
import { MapPin, Calendar, Camera } from 'lucide-react';
import { type Trip } from '@/types';
import { formatDateShort, formatDate } from '@/lib/utils';

interface TripCardProps {
  trip: Trip;
}

const COVER_GRADIENTS = [
  'from-rose-400 to-pink-600',
  'from-orange-300 to-red-400',
  'from-pink-300 to-rose-500',
  'from-purple-300 to-pink-400',
  'from-amber-300 to-orange-400',
];

export function TripCard({ trip }: TripCardProps) {
  const gradientIndex = trip.id.charCodeAt(0) % COVER_GRADIENTS.length;
  const gradient = COVER_GRADIENTS[gradientIndex];

  return (
    <Link href={`/trips/${trip.id}`} className="block group">
      <div className="relative overflow-hidden rounded-3xl shadow-md hover:shadow-xl transition-all duration-300 aspect-[3/4]">
        {/* Cover image or gradient */}
        {trip.cover_photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={trip.cover_photo_url}
            alt={trip.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Washi tape accent */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-3 bg-white/40 rounded-sm rotate-[-1deg]" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-4">
          <div className="text-white">
            <h3 className="font-display text-2xl font-bold leading-tight mb-1">
              {trip.title}
            </h3>

            {trip.location && (
              <div className="flex items-center gap-1 text-white/80 text-xs mb-2">
                <MapPin className="w-3 h-3" />
                {trip.location}
              </div>
            )}

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1 text-white/70 text-xs">
                <Calendar className="w-3 h-3" />
                {formatDateShort(trip.start_date)}
                {trip.end_date && ` – ${formatDateShort(trip.end_date)}`}
              </div>

              {trip.memory_count !== undefined && trip.memory_count > 0 && (
                <div className="flex items-center gap-1 text-white/70 text-xs">
                  <Camera className="w-3 h-3" />
                  {trip.memory_count}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Photo corner decorations */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-white/40 rounded-tl" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-white/40 rounded-tr" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-white/40 rounded-bl" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-white/40 rounded-br" />
      </div>
    </Link>
  );
}
