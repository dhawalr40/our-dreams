'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Camera, MapPin, Calendar, Heart, Tag, Loader2 } from 'lucide-react';
import { MOOD_LABELS, type Mood } from '@/types';
import { PhotoUploader } from './PhotoUploader';

interface AddMemoryModalProps {
  open: boolean;
  onClose: () => void;
  tripId?: string;
}

export function AddMemoryModal({ open, onClose, tripId }: AddMemoryModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [mood, setMood] = useState<Mood | ''>('');
  const [tags, setTags] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get world id
      const { data: member } = await supabase
        .from('world_members')
        .select('world_id')
        .eq('user_id', user.id)
        .order('role', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!member) throw new Error('No world found. Please set up your world first.');

      // Create memory
      const { data: memory, error: memoryError } = await supabase
        .from('memories')
        .insert({
          world_id: member.world_id,
          trip_id: tripId || null,
          title,
          description,
          date,
          location: location || null,
          mood: mood || null,
          is_favorite: isFavorite,
          created_by: user.id,
        })
        .select()
        .single();

      if (memoryError) throw memoryError;

      // Upload photos
      if (photos.length > 0) {
        for (let i = 0; i < photos.length; i++) {
          const photo = photos[i];
          const ext = photo.name.split('.').pop();
          const path = `worlds/${member.world_id}/memories/${memory.id}/${Date.now()}_${i}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from('photos')
            .upload(path, photo, { cacheControl: '3600' });

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('photos')
              .getPublicUrl(path);

            await supabase.from('memory_photos').insert({
              memory_id: memory.id,
              url: publicUrl,
              sort_order: i,
            });
          }
        }
      }

      // Add tags
      if (tags.trim()) {
        const tagNames = tags.split(',').map(t => t.trim()).filter(Boolean);
        for (const tagName of tagNames) {
          let { data: tag } = await supabase
            .from('tags')
            .select()
            .eq('world_id', member.world_id)
            .eq('name', tagName)
            .single();

          if (!tag) {
            const { data: newTag } = await supabase
              .from('tags')
              .insert({ world_id: member.world_id, name: tagName })
              .select()
              .single();
            tag = newTag;
          }

          if (tag) {
            await supabase.from('memory_tags').insert({ memory_id: memory.id, tag_id: tag.id });
          }
        }
      }

      onClose();
      router.refresh();
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
    setDate(new Date().toISOString().split('T')[0]);
    setLocation('');
    setMood('');
    setTags('');
    setIsFavorite(false);
    setPhotos([]);
    setError('');
  }

  function handleClose() {
    onClose();
    resetForm();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border-[#f0ddd8] bg-white">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-[#3d2b2b]">
            Add a little memory ♡
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-[#fde8e8] border border-[#f4b8c1] rounded-xl text-[#c0392b] text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-[#3d2b2b] font-medium text-sm mb-1.5 block">
              What happened? *
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give this memory a title..."
              required
              className="rounded-xl border-[#f0ddd8] bg-[#faf6f1] focus:border-[#d94f6c]"
            />
          </div>

          <div>
            <Label className="text-[#3d2b2b] font-medium text-sm mb-1.5 block">
              Tell the story
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What made this moment special?"
              rows={3}
              className="rounded-xl border-[#f0ddd8] bg-[#faf6f1] focus:border-[#d94f6c] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[#3d2b2b] font-medium text-sm mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#d94f6c]" />
                Date
              </Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="rounded-xl border-[#f0ddd8] bg-[#faf6f1] focus:border-[#d94f6c]"
              />
            </div>
            <div>
              <Label className="text-[#3d2b2b] font-medium text-sm mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#d94f6c]" />
                Location
              </Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Where were you?"
                className="rounded-xl border-[#f0ddd8] bg-[#faf6f1] focus:border-[#d94f6c]"
              />
            </div>
          </div>

          <div>
            <Label className="text-[#3d2b2b] font-medium text-sm mb-2 block">Mood</Label>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(MOOD_LABELS) as [Mood, string][]).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMood(mood === key ? '' : key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    mood === key
                      ? 'bg-[#d94f6c] text-white'
                      : 'bg-[#fde8e8] text-[#8c7b7b] hover:bg-[#f4b8c1] hover:text-[#3d2b2b]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-[#3d2b2b] font-medium text-sm mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#d94f6c]" />
              Tags
            </Label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="beach, sunset, food (comma separated)"
              className="rounded-xl border-[#f0ddd8] bg-[#faf6f1] focus:border-[#d94f6c]"
            />
          </div>

          <div>
            <Label className="text-[#3d2b2b] font-medium text-sm mb-2 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-[#d94f6c]" />
              Add photos 📸
            </Label>
            <PhotoUploader files={photos} onChange={setPhotos} />
          </div>

          <button
            type="button"
            onClick={() => setIsFavorite(!isFavorite)}
            className={`flex items-center gap-2 text-sm font-semibold transition-colors ${
              isFavorite ? 'text-[#d94f6c]' : 'text-[#8c7b7b]'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-[#d94f6c]' : ''}`} />
            {isFavorite ? 'This is a favorite ♡' : 'Mark as favorite'}
          </button>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 rounded-xl border-[#f0ddd8] text-[#8c7b7b]"
            >
              Maybe later
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#d94f6c] hover:bg-[#c0392b] text-white rounded-xl"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Save memory ♡'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
