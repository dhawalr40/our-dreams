import { SideNav } from '@/components/layout/SideNav';
import { BottomNav } from '@/components/layout/BottomNav';
import { AddMemoryButton } from '@/components/layout/AddMemoryButton';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <SideNav />
      <main className="md:pl-56 pb-nav md:pb-8 min-h-screen">
        {children}
      </main>
      <BottomNav />
      <AddMemoryButton />
    </div>
  );
}
