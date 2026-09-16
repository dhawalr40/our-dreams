import { cn } from '@/lib/utils';

interface EmptyStateProps {
  emoji: string;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ emoji, title, subtitle, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-16 px-6', className)}>
      <div className="text-5xl mb-4 opacity-80">{emoji}</div>
      <h3 className="text-[#3d2b2b] font-semibold text-lg mb-2">{title}</h3>
      <p className="text-[#8c7b7b] text-sm max-w-xs leading-relaxed mb-6">{subtitle}</p>
      {action}
    </div>
  );
}
