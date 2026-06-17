import { ReactNode } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { NotificationsDropdown } from '@/components/NotificationsDropdown';
import { ThemeToggle } from '@/components/ThemeToggle';

export function DashboardLayout({ children }: { children: ReactNode }) {
  const handleEquipeTabChange = (tab: string) => {
    window.dispatchEvent(new CustomEvent('equipe-tab-change', { detail: tab }));
  };

  const handleClienteTabChange = (tab: string) => {
    window.dispatchEvent(new CustomEvent('cliente-tab-change', { detail: tab }));
  };

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar onEquipeTabChange={handleEquipeTabChange} onClienteTabChange={handleClienteTabChange} />
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="px-4 py-6 md:p-8 max-w-[1280px] mx-auto pt-16 md:pt-8">
          <div className="flex items-center gap-2 justify-end mb-4 md:mb-0 md:absolute md:top-4 md:right-8 z-30">
            <ThemeToggle />
            <NotificationsDropdown />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
