import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    ? 'bg-accent/10 text-accent' 
    : variant === 'primary' 
      ? 'bg-primary/10 text-primary' 
      : 'bg-primary/8 text-primary';
  
  return (
    <Card className="card-glow border-border/60 bg-card overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-xl ${iconBg}`}>
            <Icon className="h-4 w-4" />
          </div>
          {trend && trend !== 'neutral' && (
            <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
              trend === 'up' ? 'bg-accent/10 text-accent' : 'bg-destructive/10 text-destructive'
            }`}>
              {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            </div>
          )}
        </div>
        <div className="text-2xl font-bold tracking-tight text-foreground">{value}</div>
        <p className="text-xs text-muted-foreground mt-1 tracking-wide uppercase">{title}</p>
        {subtitle && (
          <p className={`text-xs mt-1.5 ${
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
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
