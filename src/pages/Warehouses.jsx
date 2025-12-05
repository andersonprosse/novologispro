import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Warehouse as WarehouseIcon, MapPin, Plus, X, Pencil } from 'lucide-react';
import LogisticsMap from '@/components/logistics/LogisticsMap';
import { toast } from "sonner";

export default function WarehousesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [newWarehouse, setNewWarehouse] = useState({
    name: '',
    address: '',
    capacity: 0,
    lat: -23.550520,
    lng: -46.633308,
    status: 'active'
  });

  const queryClient = useQueryClient();

  // CORREÇÃO 1: Usando .findMany()
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => base44.entities.Warehouse.findMany(),
  });

  // CORREÇÃO 2: Garantindo array seguro para o mapa
  const safeWarehouses = Array.isArray(warehouses) ? warehouses : [];

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Warehouse.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['warehouses']);
      setIsDialogOpen(false);
      toast.success("Galpão cadastrado com sucesso!");
      setNewWarehouse({
        name: '', address: '', capacity: 0,
        lat: -23.550520, lng: -46.633308, status: 'active'
      });
    },
    onError: () => toast.error("Erro ao cadastrar galpão")
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Warehouse.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['warehouses']);
      setEditingWarehouse(null);
      toast.success("Galpão atualizado com sucesso!");
    },
    onError: () => toast.error("Erro ao atualizar galpão")
  });

  const handleMapClick = (e) => {
    if (isDialogOpen) {
      setNewWarehouse({
        ...newWarehouse,
        lat: e.latlng.lat,
        lng: e.latlng.lng
      });
      toast.info("Localização selecionada!");
    } else if (editingWarehouse) {
      setEditingWarehouse({
        ...editingWarehouse,
        lat: e.latlng.lat,
        lng: e.latlng.lng
      });
      toast.info("Localização atualizada!");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Galpões e Centros de Distribuição</h2>
          <p className="text-slate-500">Gerencie seus pontos de armazenamento</p>
        </div>

        <Button 
          onClick={() => setIsDialogOpen(!isDialogOpen)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
        >
          {isDialogOpen ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {isDialogOpen ? 'Cancelar' : 'Novo Galpão'}
        </Button>
      </div>

      {/* Full Screen Map Layout */}
      <div className="relative h-[calc(100vh-200px)] rounded-2xl overflow-hidden border border-slate-200 shadow-lg">
        <div className="absolute inset-0">
           <LogisticsMap 
             warehouses={isDialogOpen ? [...safeWarehouses, {
                id: 'new-preview',
                name: 'Nova Localização',
                address: newWarehouse.address || 'Endereço selecionado',
                lat: newWarehouse.lat,
                lng: newWarehouse.lng,
                capacity: newWarehouse.capacity,
                status: 'active'
             }] : safeWarehouses} 
             onMapClick={handleMapClick}
             height="100%"
           />
        </div>
        
        {/* Floating Form for New Warehouse (Right Side) */}
        {isDialogOpen && (
          <div className="absolute top-4 right-4 w-96 bg-white/95 backdrop-blur-sm shadow-2xl rounded-xl p-6 border border-gray-100 z-20 animate-in slide-in-from-right duration-300">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
               <Plus className="w-5 h-5 text-emerald-600" /> Novo Galpão
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Galpão</Label>
                <Input 
                  value={newWarehouse.name} 
                  onChange={e => setNewWarehouse({...newWarehouse, name: e.target.value})}
                  placeholder="CD São Paulo - Norte" 
                />
              </div>
              <div className="space-y-2">
                <Label>Endereço</Label>
                <Input 
                  value={newWarehouse.address} 
                  onChange={e => setNewWarehouse({...newWarehouse, address: e.target.value})}
                  placeholder="Rua Exemplo, 123" 
                />
              </div>
              <div className="space-y-2">
                <Label>Capacidade (m³)</Label>
                <Input 
                  type="number"
                  value={newWarehouse.capacity} 
                  onChange={e => setNewWarehouse({...newWarehouse, capacity: parseFloat(e.target.value)})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Latitude</Label>
                  <Input 
                    type="number" 
                    value={newWarehouse.lat} 
                    onChange={e => setNewWarehouse({...newWarehouse, lat: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Longitude</Label>
                  <Input 
                    type="number" 
                    value={newWarehouse.lng} 
                    onChange={e => setNewWarehouse({...newWarehouse, lng: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
              <p className="text-xs text-slate-600 bg-emerald-50 border border-emerald-100 p-2 rounded flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                * Dica: Clique no mapa ao lado para preencher as coordenadas automaticamente.
              </p>
              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => createMutation.mutate(newWarehouse)}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Salvando...' : 'Cadastrar Galpão'}
              </Button>
            </div>
          </div>
        )}

        {/* Floating Form for Editing Warehouse */}
        {editingWarehouse && (
          <div className="absolute top-4 right-4 w-96 bg-white/95 backdrop-blur-sm shadow-2xl rounded-xl p-6 border border-gray-100 z-20 animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                 <Pencil className="w-5 h-5 text-blue-600" /> Editar Galpão
              </h3>
              <Button size="icon" variant="ghost" onClick={() => setEditingWarehouse(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Galpão</Label>
                <Input 
                  value={editingWarehouse.name} 
                  onChange={e => setEditingWarehouse({...editingWarehouse, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Endereço</Label>
                <Input 
                  value={editingWarehouse.address} 
                  onChange={e => setEditingWarehouse({...editingWarehouse, address: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Capacidade (m³)</Label>
                <Input 
                  type="number"
                  value={editingWarehouse.capacity} 
                  onChange={e => setEditingWarehouse({...editingWarehouse, capacity: parseFloat(e.target.value)})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Latitude</Label>
                  <Input 
                    type="number" 
                    value={editingWarehouse.lat} 
                    onChange={e => setEditingWarehouse({...editingWarehouse, lat: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Longitude</Label>
                  <Input 
                    type="number" 
                    value={editingWarehouse.lng} 
                    onChange={e => setEditingWarehouse({...editingWarehouse, lng: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
              <p className="text-xs text-slate-600 bg-blue-50 border border-blue-100 p-2 rounded flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                * Dica: Clique no mapa para atualizar a localização.
              </p>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => updateMutation.mutate({ id: editingWarehouse.id, data: editingWarehouse })}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        )}

        {/* Floating Sidebar for List */}
        <div className="absolute top-4 left-4 w-80 bg-white/95 backdrop-blur-sm shadow-2xl rounded-xl max-h-[calc(100%-32px)] overflow-y-auto p-4 border border-gray-100 z-10">
           <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <WarehouseIcon className="w-5 h-5 text-emerald-600" /> Galpões Cadastrados
           </h3>
           <div className="space-y-3">
              {safeWarehouses.map((wh) => (
                <div key={wh.id} className="p-3 rounded-lg border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all bg-white shadow-sm group relative">
                  <h4 className="font-bold text-gray-800 text-sm pr-6">{wh.name}</h4>
                  <p className="text-xs text-gray-500 mt-1 truncate">{wh.address}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-[10px] bg-white">{wh.capacity}m³</Badge>
                    <Badge className="text-[10px] bg-green-100 text-green-700 hover:bg-green-100">Ativo</Badge>
                  </div>
                  <button 
                   onClick={(e) => {
                     e.stopPropagation();
                     setEditingWarehouse(wh);
                     setIsDialogOpen(false); 
                   }}
                   className="absolute top-3 right-3 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}