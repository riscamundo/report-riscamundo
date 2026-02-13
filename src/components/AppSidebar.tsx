import { useState } from 'react';
import { NavLink } from '@/components/NavLink';
import { useStoreContext } from '@/contexts/StoreContext';
import { Perfil } from '@/types';
import {
  LayoutDashboard, Package, Megaphone, Users, ShoppingCart, AlertTriangle,
  ChevronLeft, ChevronRight, Crown, TrendingUp, Target
} from 'lucide-react';

const allNavItems = [
  { title: 'Visão Executiva', url: '/', icon: LayoutDashboard, roles: ['gestor', 'marketing', 'vendas'] as Perfil[] },
  { title: 'Procedimentos', url: '/procedimentos', icon: Package, roles: ['gestor'] as Perfil[] },
  { title: 'Mídia & Performance', url: '/midia', icon: Megaphone, roles: ['gestor', 'marketing'] as Perfil[] },
  { title: 'Funil de Vendas', url: '/funil', icon: Users, roles: ['gestor', 'marketing', 'vendas'] as Perfil[] },
  { title: 'Vendas & Forecast', url: '/vendas', icon: ShoppingCart, roles: ['gestor', 'vendas'] as Perfil[] },
  { title: 'Alertas', url: '/alertas', icon: AlertTriangle, roles: ['gestor'] as Perfil[] },
];

const perfilConfig: Record<Perfil, { label: string; icon: typeof Crown }> = {
  gestor: { label: 'Gestor', icon: Crown },
  marketing: { label: 'Marketing', icon: TrendingUp },
  vendas: { label: 'Vendas', icon: Target },
};

export function AppSidebar() {
  const { perfil, setPerfil } = useStoreContext();
  const [collapsed, setCollapsed] = useState(false);
  const visibleItems = allNavItems.filter(item => item.roles.includes(perfil));

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-64'} min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300`}>
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        {!collapsed && (
          <div>
            <h1 className="text-lg font-display font-bold gold-text">Estética</h1>
            <p className="text-xs text-muted-foreground">Premium Dashboard</p>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {visibleItems.map(item => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === '/'}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            activeClassName="bg-sidebar-accent text-primary font-medium"
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Profile Selector */}
      <div className="p-3 border-t border-sidebar-border">
        {!collapsed ? (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground px-2 mb-2">Perfil</p>
            {(Object.keys(perfilConfig) as Perfil[]).map(p => {
              const cfg = perfilConfig[p];
              return (
                <button
                  key={p}
                  onClick={() => setPerfil(p)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    perfil === p ? 'bg-primary/10 text-primary' : 'text-sidebar-foreground hover:bg-sidebar-accent'
                  }`}
                >
                  <cfg.icon className="h-3.5 w-3.5" />
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            {(Object.keys(perfilConfig) as Perfil[]).map(p => {
              const cfg = perfilConfig[p];
              return (
                <button
                  key={p}
                  onClick={() => setPerfil(p)}
                  className={`p-2 rounded-lg transition-colors ${perfil === p ? 'text-primary' : 'text-sidebar-foreground hover:bg-sidebar-accent'}`}
                  title={cfg.label}
                >
                  <cfg.icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
