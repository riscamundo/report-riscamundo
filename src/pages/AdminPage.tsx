import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PageHeader } from '@/components/KPICard';
import { AnimatedPage, StaggerContainer, StaggerItem } from '@/components/AnimatedPage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Shield, Users, Building2, Plus, Trash2 } from 'lucide-react';
import type { AppRole } from '@/types';

interface UserWithRole {
  user_id: string;
  display_name: string | null;
  role: AppRole | null;
}

interface Equipe {
  id: string;
  nome: string;
  gestor_id: string;
  gestor_name?: string;
  members: { user_id: string; display_name: string | null }[];
}

export default function AdminPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isEquipeOpen, setIsEquipeOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<AppRole>('equipe');
  const [newEquipeName, setNewEquipeName] = useState('');
  const [newEquipeGestor, setNewEquipeGestor] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from('profiles').select('user_id, display_name');
    const { data: roles } = await supabase.from('user_roles').select('user_id, role');

    if (profiles) {
      const userList: UserWithRole[] = profiles.map(p => {
        const userRole = roles?.find(r => r.user_id === p.user_id);
        return {
          user_id: p.user_id,
          display_name: p.display_name,
          role: (userRole?.role as AppRole) || null,
        };
      });
      setUsers(userList);
    }
    setLoading(false);
  };

  const fetchEquipes = async () => {
    const { data: equipeRows } = await supabase.from('equipes').select('*');
    const { data: members } = await supabase.from('equipe_members').select('*');
    const { data: profiles } = await supabase.from('profiles').select('user_id, display_name');

    if (equipeRows) {
      const result: Equipe[] = equipeRows.map(e => {
        const gestorProfile = profiles?.find(p => p.user_id === e.gestor_id);
        const equipeMembers = (members || [])
          .filter(m => m.equipe_id === e.id)
          .map(m => {
            const profile = profiles?.find(p => p.user_id === m.user_id);
            return { user_id: m.user_id, display_name: profile?.display_name || null };
          });
        return {
          id: e.id,
          nome: e.nome,
          gestor_id: e.gestor_id,
          gestor_name: gestorProfile?.display_name || 'Sem nome',
          members: equipeMembers,
        };
      });
      setEquipes(result);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchEquipes();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.auth.signUp({
        email: newEmail,
        password: newPassword,
        options: { data: { display_name: newName } },
      });
      if (error) throw error;

      if (data.user) {
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

  const handleChangeRole = async (userId: string, role: AppRole) => {
    const { data: existing } = await supabase.from('user_roles').select('id').eq('user_id', userId).maybeSingle();
    if (existing) {
      await supabase.from('user_roles').update({ role }).eq('user_id', userId);
    } else {
      await supabase.from('user_roles').insert({ user_id: userId, role });
    }
    toast({ title: 'Permissão atualizada' });
    fetchUsers();
  };

  const handleCreateEquipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEquipeName || !newEquipeGestor) return;
    const { error } = await supabase.from('equipes').insert({ nome: newEquipeName, gestor_id: newEquipeGestor });
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Equipe criada!' });
      setIsEquipeOpen(false);
      setNewEquipeName('');
      setNewEquipeGestor('');
      fetchEquipes();
    }
  };

  const handleAddMember = async (equipeId: string, userId: string) => {
    const { error } = await supabase.from('equipe_members').insert({ equipe_id: equipeId, user_id: userId });
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Membro adicionado!' });
      fetchEquipes();
    }
  };

  const handleRemoveMember = async (equipeId: string, userId: string) => {
    await supabase.from('equipe_members').delete().eq('equipe_id', equipeId).eq('user_id', userId);
    toast({ title: 'Membro removido' });
    fetchEquipes();
  };

  const gestores = users.filter(u => u.role === 'gestor');
  const equipeUsers = users.filter(u => u.role === 'equipe' || !u.role);

  const roleLabel = (role: AppRole | null) => {
    if (role === 'master') return '👑 Master';
    if (role === 'gestor') return '🏢 Gestor';
    return '👤 Equipe';
  };

  const roleBadgeClass = (role: AppRole | null) => {
    if (role === 'master') return 'bg-primary/20 text-primary border-0';
    if (role === 'gestor') return 'bg-info/20 text-info border-0';
    return 'bg-secondary text-secondary-foreground border-0';
  };

  return (
    <DashboardLayout>
      <AnimatedPage>
        <PageHeader
          title="Administração"
          subtitle="Gestão de usuários, equipes e permissões"
          action={
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><UserPlus className="h-4 w-4 mr-1" /> Novo Usuário</Button>
              </DialogTrigger>
              <DialogContent className="bg-card">
                <DialogHeader><DialogTitle className="font-display">Criar Usuário</DialogTitle></DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div><Label>Nome</Label><Input value={newName} onChange={e => setNewName(e.target.value)} required className="mt-1" /></div>
                  <div><Label>Email</Label><Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required className="mt-1" /></div>
                  <div><Label>Senha</Label><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} className="mt-1" /></div>
                  <div><Label>Perfil</Label>
                    <Select value={newRole} onValueChange={v => setNewRole(v as AppRole)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equipe">👤 Equipe</SelectItem>
                        <SelectItem value="gestor">🏢 Gestor</SelectItem>
                        <SelectItem value="master">👑 Master</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full">Criar Usuário</Button>
                </form>
              </DialogContent>
            </Dialog>
          }
        />

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StaggerItem>
            <Card className="card-glow">
              <CardContent className="p-4 flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold font-display">{users.length}</p>
                  <p className="text-xs text-muted-foreground">Total de Usuários</p>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card className="card-glow">
              <CardContent className="p-4 flex items-center gap-3">
                <Shield className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold font-display">{users.filter(u => u.role === 'master').length}</p>
                  <p className="text-xs text-muted-foreground">Masters</p>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card className="card-glow">
              <CardContent className="p-4 flex items-center gap-3">
                <Building2 className="h-8 w-8 text-info" />
                <div>
                  <p className="text-2xl font-bold font-display">{gestores.length}</p>
                  <p className="text-xs text-muted-foreground">Gestores</p>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card className="card-glow">
              <CardContent className="p-4 flex items-center gap-3">
                <Users className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold font-display">{equipeUsers.length}</p>
                  <p className="text-xs text-muted-foreground">Equipe</p>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerContainer>

        <Tabs defaultValue="usuarios" className="space-y-4">
          <TabsList>
            <TabsTrigger value="usuarios">Usuários</TabsTrigger>
            <TabsTrigger value="equipes">Equipes</TabsTrigger>
          </TabsList>

          <TabsContent value="usuarios">
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
                          <Badge className={roleBadgeClass(u.role)}>{roleLabel(u.role)}</Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={u.role || 'equipe'}
                            onValueChange={v => handleChangeRole(u.user_id, v as AppRole)}
                          >
                            <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="equipe">Equipe</SelectItem>
                              <SelectItem value="gestor">Gestor</SelectItem>
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
          </TabsContent>

          <TabsContent value="equipes">
            <div className="flex justify-end mb-4">
              <Dialog open={isEquipeOpen} onOpenChange={setIsEquipeOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Equipe</Button>
                </DialogTrigger>
                <DialogContent className="bg-card">
                  <DialogHeader><DialogTitle className="font-display">Criar Equipe</DialogTitle></DialogHeader>
                  <form onSubmit={handleCreateEquipe} className="space-y-4">
                    <div><Label>Nome da Equipe</Label><Input value={newEquipeName} onChange={e => setNewEquipeName(e.target.value)} required className="mt-1" /></div>
                    <div><Label>Gestor Responsável</Label>
                      <Select value={newEquipeGestor} onValueChange={setNewEquipeGestor}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o gestor..." /></SelectTrigger>
                        <SelectContent>
                          {gestores.map(g => (
                            <SelectItem key={g.user_id} value={g.user_id}>{g.display_name || g.user_id.slice(0, 8)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {gestores.length === 0 && (
                        <p className="text-xs text-muted-foreground mt-1">Primeiro defina um usuário como Gestor na aba Usuários.</p>
                      )}
                    </div>
                    <Button type="submit" className="w-full" disabled={gestores.length === 0}>Criar Equipe</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {equipes.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhuma equipe criada. Crie uma equipe e atribua um gestor.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {equipes.map(eq => {
                  const availableMembers = equipeUsers.filter(u => !eq.members.some(m => m.user_id === u.user_id));
                  return (
                    <Card key={eq.id}>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-base font-sans">{eq.nome}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-1">Gestor: <span className="text-info font-medium">{eq.gestor_name}</span></p>
                        </div>
                        <Badge variant="outline">{eq.members.length} membro(s)</Badge>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {eq.members.map(m => (
                            <div key={m.user_id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                              <span className="text-sm">{m.display_name || m.user_id.slice(0, 8)}</span>
                              <Button variant="ghost" size="sm" onClick={() => handleRemoveMember(eq.id, m.user_id)}>
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </div>
                          ))}
                          {eq.members.length === 0 && (
                            <p className="text-xs text-muted-foreground text-center py-2">Nenhum membro adicionado</p>
                          )}
                        </div>
                        {availableMembers.length > 0 && (
                          <div className="mt-3 flex gap-2 items-center">
                            <Select onValueChange={(userId) => handleAddMember(eq.id, userId)}>
                              <SelectTrigger className="flex-1 h-8 text-xs"><SelectValue placeholder="Adicionar membro..." /></SelectTrigger>
                              <SelectContent>
                                {availableMembers.map(u => (
                                  <SelectItem key={u.user_id} value={u.user_id}>{u.display_name || u.user_id.slice(0, 8)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </AnimatedPage>
    </DashboardLayout>
  );
}
