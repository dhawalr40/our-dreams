'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Plane, Camera, Mail, Heart, Sparkles, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  { href: '/home', icon: Home, label: 'Home', emoji: '🏠' },
  { href: '/trips', icon: Plane, label: 'Trips', emoji: '✈️' },
  { href: '/memories', icon: Camera, label: 'Memories', emoji: '📸' },
  { href: '/letters', icon: Mail, label: 'Letters', emoji: '💌' },
  { href: '/us', icon: Heart, label: 'Us', emoji: '💗' },
  { href: '/future', icon: Sparkles, label: 'Future', emoji: '✨' },
];

export function SideNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <nav className="hidden md:flex flex-col w-56 min-h-screen bg-white border-r border-[#f0ddd8] p-4 fixed left-0 top-0 z-40">
      {/* Logo */}
      <Link href="/home" className="flex items-center gap-2.5 mb-8 px-2 pt-2">
        <span className="text-2xl">🎀</span>
        <div>
          <div className="font-display text-lg text-[#3d2b2b] leading-tight">Our Little</div>
          <div className="font-display text-lg text-[#d94f6c] leading-tight">World</div>
        </div>
      </Link>

      {/* Nav items */}
      <div className="space-y-1 flex-1">
        {navItems.map(({ href, label, emoji }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all',
                isActive
                  ? 'bg-[#fde8e8] text-[#d94f6c]'
                  : 'text-[#8c7b7b] hover:bg-[#faf6f1] hover:text-[#3d2b2b]'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="text-base w-5 text-center">{emoji}</span>
              {label}
            </Link>
          );
        })}
      </div>

      {/* Bottom actions */}
      <div className="space-y-1 pt-4 border-t border-[#f0ddd8]">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all',
            pathname === '/settings'
              ? 'bg-[#fde8e8] text-[#d94f6c]'
              : 'text-[#8c7b7b] hover:bg-[#faf6f1] hover:text-[#3d2b2b]'
          )}
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#8c7b7b] hover:bg-[#fde8e8] hover:text-[#d94f6c] transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </nav>
  );
}
