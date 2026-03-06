import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PageHeader } from '@/components/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Shield, Users, Trash2 } from 'lucide-react';

interface UserWithRole {
  user_id: string;
  email: string;
  display_name: string | null;
  role: 'master' | 'equipe' | null;
}

export default function AdminPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'master' | 'equipe'>('equipe');

  const fetchUsers = async () => {
    setLoading(true);
    // Fetch profiles and roles
    const { data: profiles } = await supabase.from('profiles').select('user_id, display_name');
    const { data: roles } = await supabase.from('user_roles').select('user_id, role');

    if (profiles) {
      const userList: UserWithRole[] = profiles.map(p => {
        const userRole = roles?.find(r => r.user_id === p.user_id);
        return {
          user_id: p.user_id,
          email: '', // We'll show user_id since we can't access auth.users
          display_name: p.display_name,
          role: userRole?.role || null,
        };
      });
      setUsers(userList);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Sign up the user via auth
      const { data, error } = await supabase.auth.signUp({
        email: newEmail,
        password: newPassword,
        options: { data: { display_name: newName } },
      });
      if (error) throw error;

      if (data.user) {
        // Assign role
        await supabase.from('user_roles').insert({ user_id: data.user.id, role: newRole });
      }

      toast({ title: 'Usuário criado!', description: `${newEmail} adicionado como ${newRole}` });
      setIsOpen(false);
      setNewEmail('');
      setNewPassword('');
      setNewName('');
      fetchUsers();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handleChangeRole = async (userId: string, role: 'master' | 'equipe') => {
    // Upsert role
    const { data: existing } = await supabase.from('user_roles').select('id').eq('user_id', userId).maybeSingle();
    if (existing) {
      await supabase.from('user_roles').update({ role }).eq('user_id', userId);
    } else {
      await supabase.from('user_roles').insert({ user_id: userId, role });
    }
    toast({ title: 'Permissão atualizada' });
    fetchUsers();
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Administração"
        subtitle="Gestão de usuários e permissões"
        action={
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><UserPlus className="h-4 w-4 mr-1" /> Novo Usuário</Button>
            </DialogTrigger>
            <DialogContent className="bg-card">
              <DialogHeader><DialogTitle className="font-display">Criar Usuário</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div><Label>Nome</Label><Input value={newName} onChange={e => setNewName(e.target.value)} required /></div>
                <div><Label>Email</Label><Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required /></div>
                <div><Label>Senha</Label><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} /></div>
                <div><Label>Perfil</Label>
                  <Select value={newRole} onValueChange={v => setNewRole(v as 'master' | 'equipe')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equipe">Equipe</SelectItem>
                      <SelectItem value="master">Master</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">Criar Usuário</Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="card-glow">
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold font-display">{users.length}</p>
              <p className="text-xs text-muted-foreground">Total de Usuários</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-glow">
          <CardContent className="p-4 flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold font-display">{users.filter(u => u.role === 'master').length}</p>
              <p className="text-xs text-muted-foreground">Administradores</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-glow">
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-info" />
            <div>
              <p className="text-2xl font-bold font-display">{users.filter(u => u.role === 'equipe' || !u.role).length}</p>
              <p className="text-xs text-muted-foreground">Equipe</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base font-sans">Usuários</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.user_id}>
                  <TableCell className="font-medium">{u.display_name || 'Sem nome'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">{u.user_id.slice(0, 8)}...</TableCell>
                  <TableCell>
                    <Badge className={u.role === 'master' ? 'bg-primary/20 text-primary border-0' : 'bg-secondary text-secondary-foreground border-0'}>
                      {u.role === 'master' ? 'Master' : 'Equipe'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={u.role || 'equipe'}
                      onValueChange={v => handleChangeRole(u.user_id, v as 'master' | 'equipe')}
                    >
                      <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equipe">Equipe</SelectItem>
                        <SelectItem value="master">Master</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Nenhum usuário cadastrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
