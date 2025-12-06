import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, Search, Trash2, Pencil, X } from 'lucide-react';
import { toast } from "sonner";

// Função de segurança para evitar erros com JSON
const safeParseJSON = (data) => {
  if (Array.isArray(data)) return data; 
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return []; 
    }
  }
  return []; 
};

export default function OrdersPage() {
  const [newOrder, setNewOrder] = useState({
    customer_name: '',
    address: '',
    batch_number: '',
    warehouse_id: '',
    status: 'pending',
    lat: -23.561684,
    lng: -46.625378,
    order_number: `ORD-${Math.floor(Math.random() * 10000)}`,
    selected_types: ['Geral']
  });

  const queryClient = useQueryClient();

  // ID do usuário logado (Fundamental para a lista de recentes)
  const appUserId = localStorage.getItem('app_user_id');

  // Busca todos os pedidos
  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const data = await base44.entities.Order.findMany();
      return Array.isArray(data) ? data : [];
    }
  });

  // Busca Galpões
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const data = await base44.entities.Warehouse.findMany();
      return Array.isArray(data) ? data : [];
    }
  });

  // Busca Tipos de Veículo
  const { data: vehicleTypes = [] } = useQuery({
    queryKey: ['vehicleTypes'],
    queryFn: async () => {
      try {
        const data = await base44.entities.VehicleType.findMany();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        return [];
      }
    }
  });

  const [editingOrder, setEditingOrder] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // --- CRIAÇÃO (CORRIGIDA) ---
  const createMutation = useMutation({
    mutationFn: (data) => {
      return base44.entities.Order.create({
        customer_name: data.customer_name,
        address: data.address,
        batch_number: data.batch_number,
        warehouse_id: data.warehouse_id,
        status: data.status,
        lat: data.lat,
        lng: data.lng,
        order_number: data.order_number,
        
        // !!! AQUI ESTAVA O PROBLEMA !!!
        // Mudamos para pegar direto do localStorage, garantindo que o ID sempre vá para o banco
        app_user_id: localStorage.getItem('app_user_id'),
        app_user_email: localStorage.getItem('app_user_email'),
        
        allowed_vehicles: JSON.stringify(data.selected_types)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['orders']);
      toast.success("Pedido criado com sucesso!");
      setNewOrder({
        customer_name: '', address: '', batch_number: '', warehouse_id: '',
        status: 'pending', lat: -23.561684, lng: -46.625378,
        order_number: `ORD-${Math.floor(Math.random() * 10000)}`,
        selected_types: ['Geral']
      });
    },
    onError: () => toast.error("Erro ao criar pedido")
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => {
        const dataToSave = {
            ...data,
            allowed_vehicles: Array.isArray(data.allowed_vehicles) 
                ? JSON.stringify(data.allowed_vehicles) 
                : data.allowed_vehicles
        };
        return base44.entities.Order.update(id, dataToSave);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['orders']);
      setIsEditDialogOpen(false);
      setEditingOrder(null);
      toast.success("Pedido atualizado com sucesso!");
    },
    onError: () => toast.error("Erro ao atualizar pedido")
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Order.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders']);
      toast.success("Pedido removido com sucesso!");
    },
    onError: () => toast.error("Erro ao remover pedido")
  });

  const handleEditClick = (order) => {
      setEditingOrder({
          ...order,
          allowed_vehicles: safeParseJSON(order.allowed_vehicles)
      });
      setIsEditDialogOpen(true);
  };

  const toggleVehicleType = (type, isEditing = false) => {
    const targetState = isEditing ? editingOrder : newOrder;
    const targetField = isEditing ? 'allowed_vehicles' : 'selected_types';
    
    const current = targetState[targetField] || [];
    let updated;
    
    if (current.includes(type)) {
      updated = current.filter(t => t !== type);
    } else {
      updated = [...current, type];
    }

    if (isEditing) {
        setEditingOrder({ ...editingOrder, allowed_vehicles: updated });
    } else {
        setNewOrder({ ...newOrder, selected_types: updated });
    }
  };

  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeWarehouses = Array.isArray(warehouses) ? warehouses : [];
  const safeVehicleTypes = Array.isArray(vehicleTypes) ? vehicleTypes : [];
  
  const allOrders = safeOrders; 
  
  // FILTRO DE PEDIDOS RECENTES (Do usuário logado)
  const recentOrders = appUserId 
    ? safeOrders.filter(o => o.app_user_id === appUserId) 
    : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* === FORMULÁRIO === */}
        <Card className="bg-white dark:bg-slate-800 border-none shadow-lg h-fit">
          <CardHeader className="bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-t-xl text-white">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Novo Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label>Ponto de Partida (Origem)</Label>
              <Select 
                value={newOrder.warehouse_id} 
                onValueChange={val => setNewOrder({...newOrder, warehouse_id: val, customer_name: safeWarehouses.find(w => w.id === val)?.name || ''})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o galpão de origem" />
                </SelectTrigger>
                <SelectContent>
                  {safeWarehouses.map(wh => (
                    <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ponto de Destino (Entrega)</Label>
              <Select 
                value={newOrder.address} 
                onValueChange={val => setNewOrder({...newOrder, address: val})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o destino" />
                </SelectTrigger>
                <SelectContent>
                  {safeWarehouses.filter(wh => wh.address).map(wh => (
                    <SelectItem key={wh.id} value={wh.address}>{wh.name} ({wh.address})</SelectItem>
                  ))}
                  <SelectItem value="Outro Endereço">Outro Endereço (Manual)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Número do Lote</Label>
              <Input 
                type="text"
                value={newOrder.batch_number} 
                onChange={e => setNewOrder({...newOrder, batch_number: e.target.value})}
                placeholder="Lote #12345"
              />
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div className="mb-3">
                <Label className="text-xs uppercase font-bold text-slate-500">Veículos Notificados</Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="type-geral" 
                    checked={(newOrder.selected_types || []).includes('Geral')}
                    onCheckedChange={() => toggleVehicleType('Geral')}
                  />
                  <label htmlFor="type-geral" className="text-sm font-medium leading-none">Geral (Todos)</label>
                </div>
                {safeVehicleTypes.map((type) => (
                  <div key={type.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`type-${type.id}`} 
                      checked={(newOrder.selected_types || []).includes(type.name)}
                      onCheckedChange={() => toggleVehicleType(type.name)}
                    />
                    <label htmlFor={`type-${type.id}`} className="text-sm font-medium leading-none">{type.name}</label>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => createMutation.mutate(newOrder)}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Criando...' : 'Criar Pedido'}
            </Button>
          </CardContent>
        </Card>

        {/* === LISTA DE PEDIDOS === */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* TABELA 1: MEUS PEDIDOS RECENTES */}
          <Card className="border-none shadow-lg bg-white dark:bg-slate-800">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-emerald-700">Meus Pedidos Recentes</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
               {recentOrders.length === 0 ? (
                  <p className="text-gray-500 text-sm">Você ainda não criou nenhum pedido.</p>
               ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Destino</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-xs">{order.order_number}</TableCell>
                          <TableCell className="text-xs max-w-[150px] truncate">{order.address}</TableCell>
                          <TableCell>
                            <Badge variant={order.status === 'pending' ? 'secondary' : 'default'} className="text-[10px]">
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                             <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleEditClick(order)}>
                                <Pencil className="w-3 h-3" />
                             </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
               )}
            </CardContent>
          </Card>

          {/* TABELA 2: TODOS OS PEDIDOS */}
          <Card className="border-none shadow-lg bg-white dark:bg-slate-800">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Todos os Pedidos (Geral)</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                  <Input placeholder="Buscar pedido..." className="pl-8" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Lote</TableHead>
                      <TableHead>Notificações</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs">{order.order_number}</TableCell>
                        <TableCell className="text-xs">
                           {safeWarehouses.find(w => w.id === order.warehouse_id)?.name || 'N/A'}
                        </TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate" title={order.address}>
                           {order.address}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{order.batch_number || '-'}</TableCell>
                        <TableCell>
                           <div className="flex flex-wrap gap-1">
                             {safeParseJSON(order.allowed_vehicles).map(v => (
                               <Badge key={v} variant="outline" className="text-[10px] border-slate-300 text-slate-600">{v}</Badge>
                             ))}
                           </div>
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                                <Button 
                                size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                onClick={() => handleEditClick(order)}
                                >
                                <Pencil className="w-4 h-4" />
                                </Button>
                                <Button 
                                size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50"
                                onClick={() => {
                                    if(window.confirm('Tem certeza que deseja excluir este pedido?')) {
                                    deleteMutation.mutate(order.id);
                                    }
                                }}
                                >
                                <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {allOrders.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center text-gray-500 py-4">Nenhum pedido encontrado no sistema.</TableCell>
                        </TableRow>
                    )}
                  </TableBody>
                 </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* === DIALOG DE EDIÇÃO === */}
      {isEditDialogOpen && editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                   <Pencil className="w-5 h-5 text-blue-600" /> Editar Pedido
                </h3>
                <Button size="icon" variant="ghost" onClick={() => setIsEditDialogOpen(false)}>
                   <X className="w-5 h-5" />
                </Button>
             </div>
             <div className="p-6 space-y-4">
                <div className="space-y-2">
                   <Label>Cliente</Label>
                   <Input value={editingOrder.customer_name} onChange={e => setEditingOrder({...editingOrder, customer_name: e.target.value})} />
                </div>
                <div className="space-y-2">
                   <Label>Endereço</Label>
                   <Input value={editingOrder.address} onChange={e => setEditingOrder({...editingOrder, address: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={editingOrder.status} onValueChange={val => setEditingOrder({...editingOrder, status: val})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="assigned">Atribuído</SelectItem>
                          <SelectItem value="in_transit">Em Trânsito</SelectItem>
                          <SelectItem value="delivered">Entregue</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                   </div>
                   <div className="space-y-2">
                      <Label>Lote</Label>
                      <Input value={editingOrder.batch_number} onChange={e => setEditingOrder({...editingOrder, batch_number: e.target.value})} />
                   </div>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                   <div className="mb-3">
                      <Label className="text-xs uppercase font-bold text-slate-500">Veículos Notificados</Label>
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center space-x-2">
                         <Checkbox 
                           id="edit-type-geral" 
                           checked={(editingOrder.allowed_vehicles || []).includes('Geral')}
                           onCheckedChange={() => toggleVehicleType('Geral', true)}
                         />
                         <label htmlFor="edit-type-geral" className="text-sm font-medium">Geral</label>
                      </div>
                      {safeVehicleTypes.map((type) => (
                         <div key={type.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`edit-type-${type.id}`} 
                              checked={(editingOrder.allowed_vehicles || []).includes(type.name)}
                              onCheckedChange={() => toggleVehicleType(type.name, true)}
                            />
                            <label htmlFor={`edit-type-${type.id}`} className="text-sm font-medium">{type.name}</label>
                         </div>
                      ))}
                   </div>
                </div>

                <div className="pt-2">
                   <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => updateMutation.mutate({ id: editingOrder.id, data: editingOrder })}
                      disabled={updateMutation.isPending}
                   >
                      {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                   </Button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}