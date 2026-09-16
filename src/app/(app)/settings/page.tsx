'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Loader2, LogOut, Settings, Heart, User } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string; display_name: string } | null>(null);
  const [worldName, setWorldName] = useState('');
  const [worldTagline, setWorldTagline] = useState('');
  const [anniversaryDate, setAnniversaryDate] = useState('');
  const [nickname, setNickname] = useState('');
  const [worldId, setWorldId] = useState('');
  const [memberId, setMemberId] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      setUser({
        id: authUser.id,
        email: authUser.email || '',
        display_name: authUser.user_metadata?.display_name || '',
      });

      const { data: member } = await supabase
        .from('world_members')
        .select('id, world_id, nickname, worlds(*)')
        .eq('user_id', authUser.id)
        .single();

      if (member) {
        const world = member.worlds as unknown as { name: string; tagline: string | null; anniversary_date: string | null };
        setWorldId(member.world_id);
        setMemberId(member.id);
        setWorldName(world.name || '');
        setWorldTagline(world.tagline || '');
        setAnniversaryDate(world.anniversary_date || '');
        setNickname(member.nickname || '');
      }

      setLoading(false);
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const supabase = createClient();

    await Promise.all([
      worldId && supabase.from('worlds').update({
        name: worldName,
        tagline: worldTagline || null,
        anniversary_date: anniversaryDate || null,
      }).eq('id', worldId),
      memberId && supabase.from('world_members').update({
        nickname: nickname || null,
      }).eq('id', memberId),
    ]);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[#d94f6c]" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-[#3d2b2b]">Settings</h1>
        <p className="text-[#8c7b7b] text-sm mt-0.5">Personalize your little world</p>
      </div>

      {/* Profile */}
      <div className="bg-white rounded-3xl border border-[#f0ddd8] p-5 mb-4 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <User className="w-4 h-4 text-[#d94f6c]" />
          <h2 className="font-semibold text-[#3d2b2b]">Your Profile</h2>
        </div>
        <div className="flex items-center gap-4">
          <Avatar className="w-12 h-12 bg-[#fde8e8]">
            <AvatarFallback className="text-[#d94f6c] font-bold bg-[#fde8e8]">
              {getInitials(user?.display_name || user?.email || 'U')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-[#3d2b2b]">{user?.display_name}</p>
            <p className="text-xs text-[#8c7b7b]">{user?.email}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* World settings */}
        <div className="bg-white rounded-3xl border border-[#f0ddd8] p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-4 h-4 text-[#d94f6c]" />
            <h2 className="font-semibold text-[#3d2b2b]">Your World</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-[#3d2b2b] font-medium text-sm mb-1.5 block">World name</Label>
              <Input
                value={worldName}
                onChange={(e) => setWorldName(e.target.value)}
                placeholder="Our Little World"
                className="rounded-xl border-[#f0ddd8] bg-[#faf6f1] focus:border-[#d94f6c]"
              />
            </div>

            <div>
              <Label className="text-[#3d2b2b] font-medium text-sm mb-1.5 block">Tagline</Label>
              <Input
                value={worldTagline}
                onChange={(e) => setWorldTagline(e.target.value)}
                placeholder="a tiny place for all our favorite things"
                className="rounded-xl border-[#f0ddd8] bg-[#faf6f1] focus:border-[#d94f6c]"
              />
            </div>

            <div>
              <Label className="text-[#3d2b2b] font-medium text-sm mb-1.5 block">Anniversary date ❤️</Label>
              <Input
                type="date"
                value={anniversaryDate}
                onChange={(e) => setAnniversaryDate(e.target.value)}
                className="rounded-xl border-[#f0ddd8] bg-[#faf6f1] focus:border-[#d94f6c]"
              />
              <p className="text-xs text-[#8c7b7b] mt-1">Used to calculate days together</p>
            </div>

            <div>
              <Label className="text-[#3d2b2b] font-medium text-sm mb-1.5 block">Your nickname</Label>
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="What should they call you?"
                className="rounded-xl border-[#f0ddd8] bg-[#faf6f1] focus:border-[#d94f6c]"
              />
            </div>
          </div>
        </div>

        {saved && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm text-center font-medium">
            ✓ Saved! Your little world has been updated ♡
          </div>
        )}

        <Button
          type="submit"
          disabled={saving}
          className="w-full bg-[#d94f6c] hover:bg-[#c0392b] text-white rounded-xl py-5 font-semibold"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save changes ♡'}
        </Button>
      </form>

      {/* Logout */}
      <div className="mt-6 pt-6 border-t border-[#f0ddd8]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-[#f0ddd8] text-[#8c7b7b] hover:border-[#d94f6c] hover:text-[#d94f6c] transition-all text-sm font-semibold"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
