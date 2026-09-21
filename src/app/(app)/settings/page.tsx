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
import {
  Loader2, LogOut, Heart, User, Copy, Check, Share2, Trash2, Users,
} from 'lucide-react';
import type { WorldInvite } from '@/types';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [user, setUser]                 = useState<{ id: string; email: string; display_name: string } | null>(null);
  const [worldName, setWorldName]       = useState('');
  const [worldTagline, setWorldTagline] = useState('');
  const [anniversaryDate, setAnniversaryDate] = useState('');
  const [nickname, setNickname]         = useState('');
  const [worldId, setWorldId]           = useState('');
  const [memberId, setMemberId]         = useState('');
  const [saved, setSaved]               = useState(false);

  // Invite state
  const [invite, setInvite]             = useState<WorldInvite | null>(null);
  const [inviteUrl, setInviteUrl]       = useState('');
  const [memberCount, setMemberCount]   = useState(0);
  const [inviteMessage, setInviteMessage] = useState('');
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [revoking, setRevoking]         = useState(false);
  const [copied, setCopied]             = useState(false);

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
        .select('id, world_id, nickname, role, worlds(*)')
        .eq('user_id', authUser.id)
        .order('role', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (member) {
        const world = member.worlds as unknown as {
          name: string; tagline: string | null; anniversary_date: string | null;
        };
        setWorldId(member.world_id);
        setMemberId(member.id);
        setWorldName(world.name || '');
        setWorldTagline(world.tagline || '');
        setAnniversaryDate(world.anniversary_date || '');
        setNickname(member.nickname || '');

        // Load member count
        const { count } = await supabase
          .from('world_members')
          .select('*', { count: 'exact', head: true })
          .eq('world_id', member.world_id);
        setMemberCount(count || 0);

        // Load pending invite
        const { data: pendingInvite } = await supabase
          .from('world_invites')
          .select('*')
          .eq('world_id', member.world_id)
          .eq('status', 'pending')
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (pendingInvite) {
          setInvite(pendingInvite as WorldInvite);
          setInviteUrl(`${window.location.origin}/join?code=${pendingInvite.code}`);
        }
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
        name:             worldName,
        tagline:          worldTagline || null,
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

  async function handleCreateInvite() {
    setCreatingInvite(true);
    try {
      const res = await fetch('/api/invites', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: inviteMessage || null }),
      });
      const data = await res.json();
      if (data.code) {
        const url = `${window.location.origin}/join?code=${data.code}`;
        setInviteUrl(url);
        // Reload the invite from state
        const supabase = createClient();
        const { data: inv } = await supabase
          .from('world_invites')
          .select('*')
          .eq('code', data.code)
          .single();
        if (inv) setInvite(inv as WorldInvite);
      }
    } finally {
      setCreatingInvite(false);
    }
  }

  async function handleRevoke() {
    if (!invite) return;
    setRevoking(true);
    try {
      await fetch(`/api/invites/${invite.code}`, { method: 'DELETE' });
      setInvite(null);
      setInviteUrl('');
    } finally {
      setRevoking(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard API not available — could add a fallback
    }
  }

  async function handleShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Join Our Little World 🎀',
          text:  'I made you an invite 👀',
          url:   inviteUrl,
        });
        return;
      } catch {
        // User cancelled or share failed — fall through to copy
      }
    }
    handleCopy();
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[#d94f6c]" />
      </div>
    );
  }

  const worldIsFull = memberCount >= 2;
  const expiresLabel = invite
    ? new Date(invite.expires_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';

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
                onChange={e => setWorldName(e.target.value)}
                placeholder="Our Little World"
                className="rounded-xl border-[#f0ddd8] bg-[#faf6f1] focus:border-[#d94f6c]"
              />
            </div>

            <div>
              <Label className="text-[#3d2b2b] font-medium text-sm mb-1.5 block">Tagline</Label>
              <Input
                value={worldTagline}
                onChange={e => setWorldTagline(e.target.value)}
                placeholder="a tiny place for all our favorite things"
                className="rounded-xl border-[#f0ddd8] bg-[#faf6f1] focus:border-[#d94f6c]"
              />
            </div>

            <div>
              <Label className="text-[#3d2b2b] font-medium text-sm mb-1.5 block">Anniversary date ❤️</Label>
              <Input
                type="date"
                value={anniversaryDate}
                onChange={e => setAnniversaryDate(e.target.value)}
                className="rounded-xl border-[#f0ddd8] bg-[#faf6f1] focus:border-[#d94f6c]"
              />
              <p className="text-xs text-[#8c7b7b] mt-1">Used to calculate days together</p>
            </div>

            <div>
              <Label className="text-[#3d2b2b] font-medium text-sm mb-1.5 block">Your nickname</Label>
              <Input
                value={nickname}
                onChange={e => setNickname(e.target.value)}
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

      {/* ── Invite Partner ───────────────────────────────────── */}
      {worldId && (
        <div className="bg-white rounded-3xl border border-[#f0ddd8] p-5 mt-4 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-lg">🎀</span>
            <h2 className="font-semibold text-[#3d2b2b]">
              {worldIsFull ? 'Your People' : 'Invite Your Person'}
            </h2>
            {memberCount > 0 && (
              <span className="ml-auto flex items-center gap-1 text-xs text-[#8c7b7b]">
                <Users className="w-3 h-3" />
                {memberCount}/2
              </span>
            )}
          </div>

          {worldIsFull ? (
            /* World is complete */
            <div className="text-center py-4">
              <div className="text-3xl mb-2">🎀</div>
              <p className="text-[#3d2b2b] font-semibold text-sm">Your little world is complete!</p>
              <p className="text-[#8c7b7b] text-xs mt-1">Both of you are here ♡</p>
            </div>
          ) : invite ? (
            /* Pending invite exists */
            <div className="space-y-3">
              <div className="flex items-start justify-between text-xs text-[#8c7b7b] mb-1">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  Invite pending
                </span>
                <span>Expires {expiresLabel}</span>
              </div>

              {/* URL box */}
              <div
                className="bg-[#faf6f1] border border-[#f0ddd8] rounded-xl p-3 text-xs font-mono text-[#3d2b2b] break-all cursor-pointer"
                onClick={handleCopy}
                title="Click to copy"
              >
                {inviteUrl}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleCopy}
                  variant="outline"
                  className="flex-1 rounded-xl border-[#f0ddd8] text-[#3d2b2b] hover:border-[#d94f6c] hover:text-[#d94f6c] text-sm py-4 gap-2"
                >
                  {copied
                    ? <><Check className="w-4 h-4" /> Copied! 🎀</>
                    : <><Copy className="w-4 h-4" /> Copy</>
                  }
                </Button>
                <Button
                  type="button"
                  onClick={handleShare}
                  variant="outline"
                  className="flex-1 rounded-xl border-[#f0ddd8] text-[#3d2b2b] hover:border-[#d94f6c] hover:text-[#d94f6c] text-sm py-4 gap-2"
                >
                  <Share2 className="w-4 h-4" /> Share
                </Button>
                <Button
                  type="button"
                  onClick={handleRevoke}
                  disabled={revoking}
                  variant="outline"
                  className="rounded-xl border-[#f0ddd8] text-[#8c7b7b] hover:border-red-300 hover:text-red-500 px-3 py-4"
                  title="Revoke invite"
                >
                  {revoking
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Trash2 className="w-4 h-4" />
                  }
                </Button>
              </div>
            </div>
          ) : (
            /* No invite yet */
            <div className="space-y-3">
              <p className="text-[#8c7b7b] text-sm">
                Your little world doesn&apos;t have to be lonely.
                Invite someone special to join your memories, trips and chaos.
              </p>

              <div>
                <Label className="text-[#3d2b2b] font-medium text-sm mb-1.5 block">
                  Personal message <span className="text-[#8c7b7b] font-normal">(optional)</span>
                </Label>
                <Textarea
                  value={inviteMessage}
                  onChange={e => setInviteMessage(e.target.value)}
                  placeholder="I made you a little corner of the internet. Come join me? 🎀"
                  rows={2}
                  className="rounded-xl border-[#f0ddd8] bg-[#faf6f1] focus:border-[#d94f6c] resize-none text-sm"
                />
              </div>

              <Button
                type="button"
                onClick={handleCreateInvite}
                disabled={creatingInvite}
                className="w-full bg-[#d94f6c] hover:bg-[#c0392b] text-white rounded-xl py-4 font-semibold"
              >
                {creatingInvite
                  ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating...</>
                  : '🎀 Create Invite Link'
                }
              </Button>
            </div>
          )}
        </div>
      )}

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
