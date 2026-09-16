'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { PhotoUploader } from '@/components/shared/PhotoUploader';

interface CreateTripModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateTripModal({ open, onClose, onCreated }: CreateTripModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cover, setCover] = useState<File[]>([]);
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

      let cover_photo_url: string | null = null;

      if (cover[0]) {
        const ext = cover[0].name.split('.').pop();
        const path = `worlds/${member.world_id}/trips/covers/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(path, cover[0]);
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(path);
          cover_photo_url = publicUrl;
        }
      }

      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .insert({
          world_id: member.world_id,
          title,
          description: description || null,
          location: location || null,
          start_date: startDate,
          end_date: endDate || null,
          cover_photo_url,
          created_by: user.id,
        })
        .select()
        .single();

      if (tripError) throw tripError;

      onClose();
      onCreated();
      router.push(`/trips/${trip.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong 🎀');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border-[#f0ddd8]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-[#3d2b2b]">
            Start a new adventure ✈️
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-[#fde8e8] border border-[#f4b8c1] rounded-xl text-[#c0392b] text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <Label className="text-[#3d2b2b] font-medium text-sm mb-1.5 block">Trip name *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Goa '26 🌴"
              required
              className="rounded-xl border-[#f0ddd8] bg-[#faf6f1] focus:border-[#d94f6c]"
            />
          </div>

          <div>
            <Label className="text-[#3d2b2b] font-medium text-sm mb-1.5 block">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was this trip about?"
              rows={2}
              className="rounded-xl border-[#f0ddd8] bg-[#faf6f1] focus:border-[#d94f6c] resize-none"
            />
          </div>

          <div>
            <Label className="text-[#3d2b2b] font-medium text-sm mb-1.5 block">Location</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where did you go?"
              className="rounded-xl border-[#f0ddd8] bg-[#faf6f1] focus:border-[#d94f6c]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[#3d2b2b] font-medium text-sm mb-1.5 block">Start date *</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="rounded-xl border-[#f0ddd8] bg-[#faf6f1] focus:border-[#d94f6c]"
              />
            </div>
            <div>
              <Label className="text-[#3d2b2b] font-medium text-sm mb-1.5 block">End date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-xl border-[#f0ddd8] bg-[#faf6f1] focus:border-[#d94f6c]"
              />
            </div>
          </div>

          <div>
            <Label className="text-[#3d2b2b] font-medium text-sm mb-2 block">Cover photo 📸</Label>
            <PhotoUploader files={cover} onChange={setCover} maxFiles={1} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-xl border-[#f0ddd8] text-[#8c7b7b]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#d94f6c] hover:bg-[#c0392b] text-white rounded-xl"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Let's go ✈️"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
