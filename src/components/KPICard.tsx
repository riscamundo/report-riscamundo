import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'default' | 'primary' | 'success';
}

export function KPICard({ title, value, subtitle, icon: Icon, trend, variant = 'default' }: KPICardProps) {
  const iconBg = variant === 'success' 
    ? 'bg-accent/15 text-accent' 
    : variant === 'primary' 
      ? 'bg-primary/15 text-primary' 
      : 'bg-primary/10 text-primary';
  
  return (
    <Card className="card-glow border-border/40 bg-card overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <CardContent className="p-5 relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-2.5 rounded-xl ${iconBg} ring-1 ring-border/30`}>
            <Icon className="h-4 w-4" />
          </div>
          {trend && trend !== 'neutral' && (
            <div className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
              trend === 'up' ? 'bg-accent/10 text-accent ring-1 ring-accent/20' : 'bg-destructive/10 text-destructive ring-1 ring-destructive/20'
            }`}>
              {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            </div>
          )}
        </div>
        <div className="text-2xl font-bold tracking-tight text-foreground font-display">{value}</div>
        <p className="text-[11px] text-muted-foreground mt-1.5 tracking-wider uppercase font-medium">{title}</p>
        {subtitle && (
          <p className={`text-xs mt-2 font-medium ${
            trend === 'up' ? 'text-accent' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
          }`}>
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-display">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-2 max-w-lg">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
