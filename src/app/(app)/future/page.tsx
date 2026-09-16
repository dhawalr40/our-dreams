'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { EmptyState } from '@/components/shared/EmptyState';
import { Plus, Check, Sparkles } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { FutureMemory } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

const DEFAULT_DREAMS = [
  { emoji: '🌅', title: 'Watch a sunrise together' },
  { emoji: '❄️', title: 'Snow trip' },
  { emoji: '✈️', title: 'First international trip' },
  { emoji: '🎀', title: 'Disneyland' },
  { emoji: '🚗', title: 'Random road trip' },
  { emoji: '🌴', title: 'Beach vacation' },
];

export default function FuturePage() {
  const [dreams, setDreams] = useState<FutureMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addDescription, setAddDescription] = useState('');
  const [addEmoji, setAddEmoji] = useState('');
  const [adding, setAdding] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);

  async function loadDreams() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: member } = await supabase
      .from('world_members')
      .select('world_id')
      .eq('user_id', user.id)
      .single();
    if (!member) { setLoading(false); return; }

    const { data } = await supabase
      .from('future_memories')
      .select('*')
      .eq('world_id', member.world_id)
      .order('created_at', { ascending: false });

    setDreams(data || []);
    setLoading(false);
  }

  useEffect(() => { loadDreams(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: member } = await supabase
      .from('world_members')
      .select('world_id')
      .eq('user_id', user.id)
      .single();
    if (!member) return;

    await supabase.from('future_memories').insert({
      world_id: member.world_id,
      title: addTitle,
      description: addDescription || null,
      emoji: addEmoji || null,
      created_by: user.id,
    });

    setShowAdd(false);
    setAddTitle('');
    setAddDescription('');
    setAddEmoji('');
    setAdding(false);
    loadDreams();
  }

  async function handleComplete(dream: FutureMemory) {
    setCompleting(dream.id);
    const supabase = createClient();
    await supabase
      .from('future_memories')
      .update({ is_completed: true, completed_at: new Date().toISOString() })
      .eq('id', dream.id);
    setCompleting(null);
    loadDreams();
  }

  const pending = dreams.filter(d => !d.is_completed);
  const completed = dreams.filter(d => d.is_completed);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-[#3d2b2b]">Future Memories ✨</h1>
          <p className="text-[#8c7b7b] text-sm mt-0.5">Dreams waiting to become real</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-[#d94f6c] hover:bg-[#c0392b] text-white rounded-full px-4 py-2 text-sm font-semibold transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add dream</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-2xl animate-pulse border border-[#f0ddd8]" />
          ))}
        </div>
      ) : dreams.length === 0 ? (
        <div>
          <EmptyState
            emoji="✨"
            title="Let's dream a little"
            subtitle="What adventures are waiting for us?"
            action={
              <button
                onClick={() => setShowAdd(true)}
                className="inline-flex items-center gap-2 bg-[#d94f6c] text-white px-5 py-2.5 rounded-full text-sm font-semibold"
              >
                <Plus className="w-4 h-4" />
                Add our first dream
              </button>
            }
          />
          {/* Suggestions */}
          <div className="mt-8">
            <p className="text-[#8c7b7b] text-sm font-medium mb-3">Maybe something like...</p>
            <div className="grid grid-cols-2 gap-2">
              {DEFAULT_DREAMS.map(d => (
                <button
                  key={d.title}
                  onClick={() => { setAddTitle(d.title); setAddEmoji(d.emoji); setShowAdd(true); }}
                  className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-[#f0ddd8] hover:border-[#f4b8c1] text-left text-sm text-[#3d2b2b] font-medium transition-all"
                >
                  <span className="text-lg">{d.emoji}</span>
                  {d.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending dreams */}
          {pending.length > 0 && (
            <div>
              <h2 className="font-semibold text-[#3d2b2b] text-sm mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#d94f6c]" />
                Waiting to happen
              </h2>
              <div className="space-y-2">
                {pending.map(dream => (
                  <div
                    key={dream.id}
                    className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-[#f0ddd8] shadow-sm"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#fde8e8] flex items-center justify-center flex-shrink-0 text-lg">
                      {dream.emoji || '✨'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#3d2b2b] text-sm">{dream.title}</p>
                      {dream.description && (
                        <p className="text-xs text-[#8c7b7b] mt-0.5 truncate">{dream.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleComplete(dream)}
                      disabled={completing === dream.id}
                      className="flex-shrink-0 px-3 py-1.5 bg-[#fde8e8] hover:bg-[#d94f6c] text-[#d94f6c] hover:text-white rounded-full text-xs font-semibold transition-all flex items-center gap-1"
                    >
                      {completing === dream.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-3 h-3" />
                          We did it! ♡
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <div>
              <h2 className="font-semibold text-[#3d2b2b] text-sm mb-3 flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                We did these ♡
              </h2>
              <div className="space-y-2">
                {completed.map(dream => (
                  <div
                    key={dream.id}
                    className="flex items-center gap-3 p-4 bg-[#faf6f1] rounded-2xl border border-[#f0ddd8] opacity-70"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 text-lg">
                      {dream.emoji || '✨'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#3d2b2b] text-sm line-through">{dream.title}</p>
                      {dream.completed_at && (
                        <p className="text-xs text-[#8c7b7b] mt-0.5">Completed {formatDate(dream.completed_at)}</p>
                      )}
                    </div>
                    <div className="text-green-500 text-sm">✓</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add dream modal */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md rounded-3xl border-[#f0ddd8]">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-[#3d2b2b]">
              Add a dream ✨
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <Label className="text-[#3d2b2b] font-medium text-sm mb-1.5 block">What do you want to do? *</Label>
              <Input
                value={addTitle}
                onChange={(e) => setAddTitle(e.target.value)}
                placeholder="e.g. Watch a sunrise together"
                required
                className="rounded-xl border-[#f0ddd8] bg-[#faf6f1] focus:border-[#d94f6c]"
              />
            </div>
            <div>
              <Label className="text-[#3d2b2b] font-medium text-sm mb-1.5 block">Emoji</Label>
              <Input
                value={addEmoji}
                onChange={(e) => setAddEmoji(e.target.value)}
                placeholder="🌅"
                maxLength={2}
                className="rounded-xl border-[#f0ddd8] bg-[#faf6f1] focus:border-[#d94f6c] text-center text-lg w-20"
              />
            </div>
            <div>
              <Label className="text-[#3d2b2b] font-medium text-sm mb-1.5 block">Notes</Label>
              <Textarea
                value={addDescription}
                onChange={(e) => setAddDescription(e.target.value)}
                placeholder="Any details about this dream..."
                rows={2}
                className="rounded-xl border-[#f0ddd8] bg-[#faf6f1] focus:border-[#d94f6c] resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)} className="flex-1 rounded-xl border-[#f0ddd8] text-[#8c7b7b]">
                Cancel
              </Button>
              <Button type="submit" disabled={adding} className="flex-1 bg-[#d94f6c] hover:bg-[#c0392b] text-white rounded-xl">
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add dream ✨'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
