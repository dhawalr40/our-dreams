'use client';

import { useRef, useState, useCallback } from 'react';
import { X, Upload, Image } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoUploaderProps {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
}

export function PhotoUploader({ files, onChange, maxFiles = 10 }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(newFiles: FileList | null) {
    if (!newFiles) return;
    const validFiles = Array.from(newFiles).filter(f =>
      f.type.startsWith('image/') && f.size < 20 * 1024 * 1024
    );
    onChange([...files, ...validFiles].slice(0, maxFiles));
  }

  function removeFile(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [files]);

  const previews = files.map(f => URL.createObjectURL(f));

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        className={cn(
          'border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all',
          dragging
            ? 'border-[#d94f6c] bg-[#fde8e8]'
            : 'border-[#f0ddd8] bg-[#faf6f1] hover:border-[#f4b8c1] hover:bg-[#fde8e8]/50'
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        aria-label="Upload photos"
      >
        <div className="flex flex-col items-center gap-2">
          {dragging ? (
            <Image className="w-6 h-6 text-[#d94f6c]" />
          ) : (
            <Upload className="w-6 h-6 text-[#8c7b7b]" />
          )}
          <div className="text-sm text-[#8c7b7b]">
            <span className="font-medium text-[#d94f6c]">Tap to add photos</span>
            {' '}or drag & drop
          </div>
          <div className="text-xs text-[#8c7b7b]">
            Up to {maxFiles} photos · Max 20MB each
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        aria-label="File upload input"
      />

      {/* Preview grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {previews.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Photo ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-[#d94f6c] text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`Remove photo ${i + 1}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
