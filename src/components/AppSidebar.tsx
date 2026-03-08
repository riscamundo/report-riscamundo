import { useState } from 'react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Megaphone, Users, ShoppingCart, AlertTriangle,
  ChevronLeft, ChevronRight, Shield, LogOut, Menu, X, BarChart3, Search, ListTodo, Briefcase, Building2
} from 'lucide-react';

interface NavItem {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  masterOnly?: boolean;
  gestorAllowed?: boolean;
}

const allNavItems: NavItem[] = [
  { title: 'Visão Executiva', url: '/', icon: LayoutDashboard },
  
  { title: 'Mídia & Performance', url: '/midia', icon: Megaphone, masterOnly: true },
  { title: 'Alertas', url: '/alertas', icon: AlertTriangle, masterOnly: true },
  { title: 'Marketing Digital', url: '/marketing', icon: BarChart3, masterOnly: true },
  { title: 'SEO & Keywords', url: '/seo', icon: Search, masterOnly: true },
  { title: 'Tarefas Clientes', url: '/tarefas', icon: ListTodo, masterOnly: true },
  { title: 'Tenants', url: '/tenants', icon: Briefcase, masterOnly: true },
  { title: 'Administração', url: '/admin', icon: Shield, masterOnly: true },
  { title: 'Vendas & Forecast', url: '/vendas', icon: ShoppingCart, gestorAllowed: true },
];

export function AppSidebar() {
  const { isMaster, isGestor, role, user, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const visibleItems = allNavItems.filter(item => {
    if (item.masterOnly) return isMaster;
    return true;
  });

  const sidebarContent = (
    <>
      <div className="p-5 flex items-center justify-between">
        {!collapsed && (
          <div className="flex flex-col items-start gap-1">
            <a href="https://www.maestro.riscamundo.com.br" target="_blank" rel="noopener noreferrer" className="text-[11px] font-semibold text-sidebar-foreground/50 hover:text-sidebar-foreground/80 uppercase tracking-[0.2em] transition-colors">
              Riscamundo
            </a>
            <h1 className="text-sm font-bold text-sidebar-accent-foreground tracking-tight">REPORTS</h1>
            <p className="text-[10px] text-sidebar-foreground/40 uppercase tracking-widest">Dashboard</p>
          </div>
        )}
        {collapsed && (
          <a href="https://www.maestro.riscamundo.com.br" target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-sidebar-foreground/50 hover:text-sidebar-foreground/80 uppercase tracking-widest mx-auto transition-colors">
            R
          </a>
        )}
        <button onClick={() => { setCollapsed(!collapsed); setMobileOpen(false); }} className="p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors hidden md:block">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
        <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground md:hidden">
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {!collapsed && <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40 font-medium px-3 mb-2">Menu</p>}
        {visibleItems.map(item => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === '/'}
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-150"
            activeClassName="bg-primary/15 text-primary font-semibold shadow-sm"
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 mx-3 mb-3 rounded-xl bg-sidebar-accent/50">
        {!collapsed ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-1">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-sidebar-accent-foreground font-medium truncate">{user?.email}</p>
                <p className="text-[10px] text-sidebar-foreground/50 font-medium">
                  {isMaster ? '👑 Master' : isGestor ? '🏢 Gestor' : '👤 Equipe'}
                </p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-sidebar-foreground/60 hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sair</span>
            </button>
          </div>
        ) : (
          <button onClick={signOut} className="p-2 rounded-lg text-sidebar-foreground/60 hover:bg-destructive/10 hover:text-destructive transition-colors mx-auto block" title="Sair">
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-card border border-border shadow-lg md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden" 
          onClick={() => setMobileOpen(false)} 
        />
      )}

      {/* Mobile sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: mobileOpen ? 0 : -280 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed inset-y-0 left-0 w-[280px] sidebar-glow border-r border-sidebar-border flex flex-col z-50 md:hidden"
      >
        {sidebarContent}
      </motion.aside>

      {/* Desktop sidebar */}
      <aside className={`${collapsed ? 'w-[72px]' : 'w-[260px]'} min-h-screen sidebar-glow border-r border-sidebar-border flex-col transition-all duration-300 hidden md:flex`}>
        {sidebarContent}
      </aside>
    </>
  );
}
