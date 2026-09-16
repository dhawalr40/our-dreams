'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface AddEventModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const EVENT_TYPES = [
  { value: 'milestone', label: '♡ Milestone' },
  { value: 'trip', label: '✈️ Trip' },
  { value: 'birthday', label: '🎂 Birthday' },
  { value: 'anniversary', label: '⭐ Anniversary' },
  { value: 'date', label: '📅 Date' },
  { value: 'custom', label: '✨ Custom' },
];

export function AddEventModal({ open, onClose, onCreated }: AddEventModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState('milestone');
  const [emoji, setEmoji] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: member } = await supabase
        .from('world_members')
        .select('world_id')
        .eq('user_id', user.id)
        .single();
      if (!member) throw new Error('No world found');

      const { error: eventError } = await supabase
        .from('timeline_events')
        .insert({
          world_id: member.world_id,
          title,
          description: description || null,
          date,
          type,
          emoji: emoji || null,
          created_by: user.id,
        });

      if (eventError) throw eventError;

      onClose();
      onCreated();
      resetForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong 🎀');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setTitle('');
    setDescription('');
    setDate('');
    setType('milestone');
    setEmoji('');
    setError('');
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); resetForm(); } }}>
      <DialogContent className="max-w-md rounded-3xl border-[#f0ddd8]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-[#3d2b2b]">
            Add a milestone ♡
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-[#fde8e8] border border-[#f4b8c1] rounded-xl text-[#c0392b] text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <Label className="text-[#3d2b2b] font-medium text-sm mb-1.5 block">What happened? *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Our first date"
              required
              className="rounded-xl border-[#f0ddd8] bg-[#faf6f1] focus:border-[#d94f6c]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[#3d2b2b] font-medium text-sm mb-1.5 block">Date *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="rounded-xl border-[#f0ddd8] bg-[#faf6f1] focus:border-[#d94f6c]"
              />
            </div>
            <div>
              <Label className="text-[#3d2b2b] font-medium text-sm mb-1.5 block">Emoji</Label>
              <Input
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                placeholder="♡"
                maxLength={2}
                className="rounded-xl border-[#f0ddd8] bg-[#faf6f1] focus:border-[#d94f6c] text-center text-lg"
              />
            </div>
          </div>

          <div>
            <Label className="text-[#3d2b2b] font-medium text-sm mb-2 block">Type</Label>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    type === t.value
                      ? 'bg-[#d94f6c] text-white'
                      : 'bg-[#fde8e8] text-[#8c7b7b] hover:bg-[#f4b8c1]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-[#3d2b2b] font-medium text-sm mb-1.5 block">Notes</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A little note about this moment..."
              rows={2}
              className="rounded-xl border-[#f0ddd8] bg-[#faf6f1] focus:border-[#d94f6c] resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { onClose(); resetForm(); }} className="flex-1 rounded-xl border-[#f0ddd8] text-[#8c7b7b]">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-[#d94f6c] hover:bg-[#c0392b] text-white rounded-xl">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add milestone ♡'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
