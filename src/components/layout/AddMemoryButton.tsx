'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { AddMemoryModal } from '@/components/shared/AddMemoryModal';

export function AddMemoryButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-50 md:bottom-6 md:right-6 flex items-center gap-2 bg-[#d94f6c] hover:bg-[#c0392b] text-white rounded-full shadow-lg pl-4 pr-5 py-3 font-semibold text-sm transition-all active:scale-95 hover:shadow-xl"
        aria-label="Add a little memory"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        <Plus className="w-5 h-5" />
        <span className="hidden sm:inline">Add memory</span>
      </button>

      <AddMemoryModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
