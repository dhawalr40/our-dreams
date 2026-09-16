'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface CreateLetterModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const OPEN_WHEN_SUGGESTIONS = [
  'Open when you miss me',
  'Open when you\'re sad',
  'Open when we fight',
  'Open when you need motivation',
  'Open when you\'re having a bad day',
  'Open when you need a hug',
  'Open when you\'re angry with me',
  'Just because 💕',
];

export function CreateLetterModal({ open, onClose, onCreated }: CreateLetterModalProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [recipient, setRecipient] = useState('');
  const [openCondition, setOpenCondition] = useState('');
  const [openDate, setOpenDate] = useState('');
  const [isLocked, setIsLocked] = useState(false);
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

      const { error: letterError } = await supabase
        .from('letters')
        .insert({
          world_id: member.world_id,
          title,
          body,
          recipient: recipient || null,
          open_condition: openCondition || null,
          open_date: openDate || null,
          is_locked: isLocked,
          created_by: user.id,
        });

      if (letterError) throw letterError;

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
    setBody('');
    setRecipient('');
    setOpenCondition('');
    setOpenDate('');
    setIsLocked(false);
    setError('');
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); resetForm(); } }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border-[#f0ddd8]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-[#3d2b2b]">
            Write a letter 💌
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-[#fde8e8] border border-[#f4b8c1] rounded-xl text-[#c0392b] text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <Label className="text-[#3d2b2b] font-medium text-sm mb-1.5 block">Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Open when you miss me"
              required
              className="rounded-xl border-[#f0ddd8] bg-[#faf6f1] focus:border-[#d94f6c]"
            />
          </div>

          {/* Open When suggestions */}
          <div>
            <p className="text-xs text-[#8c7b7b] mb-2 font-medium">Quick suggestions:</p>
            <div className="flex flex-wrap gap-1.5">
              {OPEN_WHEN_SUGGESTIONS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTitle(s)}
                  className="px-2.5 py-1 bg-[#fde8e8] text-[#d94f6c] text-xs rounded-full hover:bg-[#d94f6c] hover:text-white transition-all font-medium"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-[#3d2b2b] font-medium text-sm mb-1.5 block">To</Label>
            <Input
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Who is this for?"
              className="rounded-xl border-[#f0ddd8] bg-[#faf6f1] focus:border-[#d94f6c]"
            />
          </div>

          <div>
            <Label className="text-[#3d2b2b] font-medium text-sm mb-1.5 block">The letter *</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Dear love,&#10;&#10;I want you to know..."
              rows={8}
              required
              className="rounded-xl border-[#f0ddd8] bg-[#faf6f1] focus:border-[#d94f6c] resize-none font-[inherit]"
            />
          </div>

          <div>
            <Label className="text-[#3d2b2b] font-medium text-sm mb-1.5 block">
              Open condition
            </Label>
            <Input
              value={openCondition}
              onChange={(e) => setOpenCondition(e.target.value)}
              placeholder="e.g. Open when you're sad"
              className="rounded-xl border-[#f0ddd8] bg-[#faf6f1] focus:border-[#d94f6c]"
            />
          </div>

          <div>
            <Label className="text-[#3d2b2b] font-medium text-sm mb-1.5 block">
              Lock until date (optional)
            </Label>
            <Input
              type="date"
              value={openDate}
              onChange={(e) => { setOpenDate(e.target.value); setIsLocked(!!e.target.value); }}
              className="rounded-xl border-[#f0ddd8] bg-[#faf6f1] focus:border-[#d94f6c]"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { onClose(); resetForm(); }}
              className="flex-1 rounded-xl border-[#f0ddd8] text-[#8c7b7b]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#d94f6c] hover:bg-[#c0392b] text-white rounded-xl"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Seal & send 💌'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
