import { useState } from 'react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Package, Megaphone, Users, ShoppingCart, AlertTriangle,
  ChevronLeft, ChevronRight, Shield, LogOut
} from 'lucide-react';

interface NavItem {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  masterOnly?: boolean;
}

const allNavItems: NavItem[] = [
  { title: 'Visão Executiva', url: '/', icon: LayoutDashboard },
  { title: 'Procedimentos', url: '/procedimentos', icon: Package, masterOnly: true },
  { title: 'Mídia & Performance', url: '/midia', icon: Megaphone, masterOnly: true },
  { title: 'Funil de Vendas', url: '/funil', icon: Users },
  { title: 'Vendas & Forecast', url: '/vendas', icon: ShoppingCart },
  { title: 'Alertas', url: '/alertas', icon: AlertTriangle, masterOnly: true },
  { title: 'Administração', url: '/admin', icon: Shield, masterOnly: true },
];

export function AppSidebar() {
  const { isMaster, user, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const visibleItems = allNavItems.filter(item => !item.masterOnly || isMaster);

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-64'} min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300`}>
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        {!collapsed && (
          <div>
            <h1 className="text-lg font-display font-bold gold-text">Estética</h1>
            <p className="text-xs text-muted-foreground">Premium CRM</p>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

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

      <div className="p-3 border-t border-sidebar-border">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="px-2">
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              <p className="text-xs text-primary font-medium">{isMaster ? 'Master' : 'Equipe'}</p>
            </div>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sair</span>
            </button>
          </div>
        ) : (
          <button onClick={signOut} className="p-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent" title="Sair">
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
