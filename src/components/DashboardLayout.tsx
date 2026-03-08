import { ReactNode } from 'react';
import { AppSidebar } from '@/components/AppSidebar';

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="px-4 py-6 md:p-8 max-w-[1280px] mx-auto pt-16 md:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
