import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, CheckSquare, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from "sonner";

// Função de segurança para garantir que o que vem do banco seja um Array.
// Lógica robusta para lidar com strings JSON escapadas ou mal formatadas.
const safeParsePages = (pages) => {
    try {
        if (Array.isArray(pages)) return pages;
        if (typeof pages === 'string') {
            // 1. Remove aspas duplas escapadas (\" para ")
            let cleanedString = pages.replace(/\\"/g, '"');
            
            // 2. Remove aspas externas se existirem (ex: "['Dashboard']")
            if (cleanedString.startsWith('"') && cleanedString.endsWith('"')) {
               cleanedString = cleanedString.substring(1, cleanedString.length - 1);
            }
            
            const parsed = JSON.parse(cleanedString);
            return Array.isArray(parsed) ? parsed : [];
        }
        return [];
    } catch (e) {
        return [];
    }
};

export default function AdminUsersPage() {
    const [editingUser, setEditingUser] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newUser, setNewUser] = useState({
        full_name: '',
        email: '',
        username: '',
        password: '',
        app_role: 'driver',
        warehouse_id: '',
        allowed_pages: []
    });

    const queryClient = useQueryClient();

    // Available Pages to control access
    const availablePages = [
        { id: 'Dashboard', label: 'Dashboard' },
        { id: 'Warehouses', label: 'Galpões' },
        { id: 'Vehicles', label: 'Veículos' },
        { id: 'Orders', label: 'Pedidos' },
        { id: 'Driver', label: 'Entregador' },
        { id: 'AdminUsers', label: 'Administração' }
    ];

    // 1. Fetch AppUsers
    const { data: appUsers = [] } = useQuery({
        queryKey: ['appUsers'],
        queryFn: () => base44.entities.AppUser.findMany(),
    });

    // 2. Fetch Warehouses
    const { data: warehouses = [] } = useQuery({
        queryKey: ['warehouses'],
        queryFn: () => base44.entities.Warehouse.findMany(),
    });

    const users = Array.isArray(appUsers) ? appUsers : [];
    const safeWarehouses = Array.isArray(warehouses) ? warehouses : [];

    // MUTAÇÕES (O Front-end está correto para chamar o DELETE do Back-end)
    const createUserMutation = useMutation({
        mutationFn: (data) => base44.entities.AppUser.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['appUsers']);
            setIsAddDialogOpen(false);
            // Limpa o formulário
            setNewUser({ full_name: '', email: '', username: '', password: '', app_role: 'driver', warehouse_id: '', allowed_pages: [] });
            toast.success("Usuário criado com sucesso!");
        },
        onError: () => toast.error("Erro ao criar usuário")
    });

    const updateUserMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.AppUser.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['appUsers']);
            setIsDialogOpen(false);
            setEditingUser(null);
            toast.success("Usuário atualizado com sucesso!");
        },
        onError: () => toast.error("Erro ao atualizar usuário")
    });

    const deleteUserMutation = useMutation({
        mutationFn: (id) => base44.entities.AppUser.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['appUsers']);
            toast.success("Usuário removido!");
        },
        onError: () => toast.error("Erro ao remover usuário")
    });

    const handleSaveUser = () => {
        if (!editingUser) return;
        
        // CORREÇÃO: Converte o array allowed_pages para STRING JSON antes de salvar
        const pagesJson = JSON.stringify(editingUser.allowed_pages || []);

        updateUserMutation.mutate({
            id: editingUser.id,
            data: {
                app_role: editingUser.app_role,
                allowed_pages: pagesJson, // <-- Enviando como string JSON
                warehouse_id: editingUser.warehouse_id
            }
        });
    };

    const handleCreateUser = () => {
        // VALIDAÇÃO: Se o backend não precisar de 'username', você pode remover a validação daqui.
        if (!newUser.full_name || !newUser.email || !newUser.username || !newUser.password) {
            toast.error("Todos os campos obrigatórios devem ser preenchidos");
            return;
        }
        
        // CORREÇÃO: Converte o array allowed_pages para STRING JSON antes de salvar
        const pagesJson = JSON.stringify(newUser.allowed_pages || []);

        createUserMutation.mutate({
            ...newUser,
            allowed_pages: pagesJson // <-- Enviando como string JSON
        });
    };

    const togglePage = (pageId) => {
        if (!editingUser) return;
        const currentPages = editingUser.allowed_pages || [];
        let newPages;
        if (currentPages.includes(pageId)) {
            newPages = currentPages.filter(p => p !== pageId);
        } else {
            newPages = [...currentPages, pageId];
        }
        setEditingUser({ ...editingUser, allowed_pages: newPages });
    };

    const openEditDialog = (user) => {
        setEditingUser({
            ...user,
            app_role: user.app_role || 'driver',
            // CORREÇÃO: Usa a função robusta para ler o valor do banco
            allowed_pages: safeParsePages(user.allowed_pages), 
            warehouse_id: user.warehouse_id || ''
        });
        setIsDialogOpen(true);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Administração de Usuários</h2>
                    <p className="text-slate-500">Gerencie permissões e acessos</p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Plus className="w-4 h-4 mr-2" /> Adicionar Usuário
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] bg-white dark:bg-slate-900">
                        <DialogHeader>
                            <DialogTitle>Cadastrar Novo Usuário</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Nome Completo</Label>
                                <Input 
                                    value={newUser.full_name} 
                                    onChange={e => setNewUser({...newUser, full_name: e.target.value})}
                                    placeholder="Ex: João Silva" 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input 
                                    value={newUser.email} 
                                    onChange={e => setNewUser({...newUser, email: e.target.value})}
                                    placeholder="Ex: joao@logispro.com" 
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Usuário (Login)</Label>
                                    <Input 
                                        value={newUser.username} 
                                        onChange={e => setNewUser({...newUser, username: e.target.value})}
                                        placeholder="Ex: joaosilva" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Senha</Label>
                                    <Input 
                                        type="password"
                                        value={newUser.password} 
                                        onChange={e => setNewUser({...newUser, password: e.target.value})}
                                        placeholder="******" 
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Função</Label>
                                    <Select 
                                        value={newUser.app_role} 
                                        onValueChange={(val) => setNewUser({...newUser, app_role: val})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Administrador</SelectItem>
                                            <SelectItem value="warehouse_leader">Líder de Galpão</SelectItem>
                                            <SelectItem value="driver">Motorista</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Vincular a Galpão</Label>
                                    <Select 
                                        value={newUser.warehouse_id} 
                                        onValueChange={(val) => setNewUser({...newUser, warehouse_id: val})}
                                        disabled={newUser.app_role === 'admin'}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Nenhum</SelectItem>
                                            {safeWarehouses.map(w => (
                                                <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Button onClick={handleCreateUser} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-4">
                                <Plus className="w-4 h-4 mr-2" /> Cadastrar Usuário
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-none shadow-lg bg-white dark:bg-slate-800">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" /> Usuários do Sistema
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Função (Role)</TableHead>
                                <TableHead>Galpão Vinculado</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.full_name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                                            user.app_role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                            user.app_role === 'warehouse_leader' ? 'bg-orange-100 text-orange-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                            {user.app_role === 'admin' ? 'Administrador' : 
                                            user.app_role === 'warehouse_leader' ? 'Líder' : 'Motorista'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {user.warehouse_id ? 
                                            safeWarehouses.find(w => w.id === user.warehouse_id)?.name || 'N/A' 
                                            : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                                                <Pencil className="w-4 h-4 mr-2" /> Editar
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon"
                                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                                onClick={() => {
                                                    if(window.confirm('Tem certeza que deseja excluir este usuário?')) {
                                                        deleteUserMutation.mutate(user.id);
                                                    }
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {users.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-4 text-gray-500">Nenhum usuário encontrado.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px] bg-white dark:bg-slate-900">
                    <DialogHeader>
                        <DialogTitle>Editar Permissões de Usuário</DialogTitle>
                    </DialogHeader>
                    
                    {editingUser && (
                        <div className="space-y-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Função do Usuário</Label>
                                    <Select 
                                        value={editingUser.app_role} 
                                        onValueChange={(val) => setEditingUser({...editingUser, app_role: val})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Administrador</SelectItem>
                                            <SelectItem value="warehouse_leader">Líder de Galpão</SelectItem>
                                            <SelectItem value="driver">Motorista</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Vincular a Galpão</Label>
                                    <Select 
                                        value={editingUser.warehouse_id || "none"} 
                                        onValueChange={(val) => setEditingUser({...editingUser, warehouse_id: val === "none" ? "" : val})}
                                        disabled={editingUser.app_role === 'admin'}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Nenhum</SelectItem>
                                            {safeWarehouses.map(w => (
                                                <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-3 border-t border-slate-100 pt-4">
                                <Label className="flex items-center gap-2">
                                    <CheckSquare className="w-4 h-4" /> Telas Permitidas
                                </Label>
                                <div className="grid grid-cols-2 gap-3">
                                    {availablePages.map((page) => (
                                        <div key={page.id} className="flex items-center space-x-2">
                                            <Checkbox 
                                                id={`page-${page.id}`} 
                                                checked={(editingUser.allowed_pages || []).includes(page.id)}
                                                onCheckedChange={() => togglePage(page.id)}
                                            />
                                            <label
                                                htmlFor={`page-${page.id}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                {page.label}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Button onClick={handleSaveUser} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                Salvar Alterações
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}