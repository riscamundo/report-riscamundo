import { useState, useEffect } from 'react';
import { Bell, X, Check, Users, ShoppingCart, Megaphone, Building2, Contact, FileText, Target, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface Notificacao {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  desativada: boolean;
  created_at: string;
  expires_at: string;
}

const tipoIcons: Record<string, typeof Bell> = {
  cliente: Users,
  lead: Target,
  venda: ShoppingCart,
  anuncio: Megaphone,
  campanha: Megaphone,
  contato: Contact,
  empresa: Building2,
  procedimento: Package,
  info: Bell,
};

const tipoCores: Record<string, string> = {
  cliente: 'text-blue-400 bg-blue-400/10',
  lead: 'text-emerald-400 bg-emerald-400/10',
  venda: 'text-amber-400 bg-amber-400/10',
  anuncio: 'text-purple-400 bg-purple-400/10',
  campanha: 'text-pink-400 bg-pink-400/10',
  contato: 'text-cyan-400 bg-cyan-400/10',
  empresa: 'text-orange-400 bg-orange-400/10',
  procedimento: 'text-indigo-400 bg-indigo-400/10',
  info: 'text-muted-foreground bg-muted',
};

export function NotificationsDropdown() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [open, setOpen] = useState(false);

  const fetchNotificacoes = async () => {
    const { data } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('desativada', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setNotificacoes(data as Notificacao[]);
  };

  useEffect(() => {
    fetchNotificacoes();
    const interval = setInterval(fetchNotificacoes, 30000);
    return () => clearInterval(interval);
  }, []);

  const naoLidas = notificacoes.filter(n => !n.lida).length;

  const marcarLida = async (id: string) => {
    await supabase.from('notificacoes').update({ lida: true }).eq('id', id);
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
  };

  const desativar = async (id: string) => {
    await supabase.from('notificacoes').update({ desativada: true }).eq('id', id);
    setNotificacoes(prev => prev.filter(n => n.id !== id));
  };

  const marcarTodasLidas = async () => {
    const ids = notificacoes.filter(n => !n.lida).map(n => n.id);
    if (ids.length === 0) return;
    await supabase.from('notificacoes').update({ lida: true }).in('id', ids);
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-xl hover:bg-accent transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {naoLidas > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 h-4.5 w-4.5 min-w-[18px] px-1 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold"
            >
              {naoLidas > 99 ? '99+' : naoLidas}
            </motion.span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0 rounded-2xl border-border/50 shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <h3 className="text-sm font-semibold text-foreground">Notificações</h3>
          {naoLidas > 0 && (
            <button
              onClick={marcarTodasLidas}
              className="text-[11px] text-primary hover:underline font-medium flex items-center gap-1"
            >
              <Check className="h-3 w-3" />
              Marcar todas como lidas
            </button>
          )}
        </div>
        <ScrollArea className="max-h-[400px]">
          {notificacoes.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
            </div>
          ) : (
            <AnimatePresence>
              {notificacoes.map(n => {
                const Icon = tipoIcons[n.tipo] || Bell;
                const cor = tipoCores[n.tipo] || tipoCores.info;
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`group flex items-start gap-3 px-4 py-3 border-b border-border/30 hover:bg-accent/50 transition-colors ${!n.lida ? 'bg-primary/5' : ''}`}
                  >
                    <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${cor}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium ${!n.lida ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {n.titulo}
                      </p>
                      <p className="text-[11px] text-muted-foreground/70 mt-0.5 truncate">{n.mensagem}</p>
                      <p className="text-[10px] text-muted-foreground/50 mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {!n.lida && (
                        <button onClick={() => marcarLida(n.id)} className="p-1 rounded hover:bg-accent" title="Marcar como lida">
                          <Check className="h-3.5 w-3.5 text-primary" />
                        </button>
                      )}
                      <button onClick={() => desativar(n.id)} className="p-1 rounded hover:bg-destructive/10" title="Desativar">
                        <X className="h-3.5 w-3.5 text-destructive" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
