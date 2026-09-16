'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Plane, Camera, Mail, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/home', icon: Home, label: 'Home' },
  { href: '/trips', icon: Plane, label: 'Trips' },
  { href: '/memories', icon: Camera, label: 'Memories' },
  { href: '/letters', icon: Mail, label: 'Letters' },
  { href: '/us', icon: Heart, label: 'Us' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-[#f0ddd8] md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around px-2 h-16">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all min-w-[56px]',
                isActive
                  ? 'text-[#d94f6c]'
                  : 'text-[#8c7b7b] hover:text-[#d94f6c]'
              )}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className={cn(
                'p-1.5 rounded-xl transition-colors',
                isActive ? 'bg-[#fde8e8]' : ''
              )}>
                <Icon className={cn('w-5 h-5', isActive ? 'fill-[#fde8e8]' : '')} />
              </div>
              <span className="text-[10px] font-semibold">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
