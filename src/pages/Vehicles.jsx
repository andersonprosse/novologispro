import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Truck, Upload, X, Package, Pencil } from 'lucide-react';
import { toast } from "sonner";

export default function VehiclesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null); 
  const [uploading, setUploading] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    plate: '',
    model: '',
    driver_name: '',
    status: 'available',
    capacity_kg: 0,
    vehicle_type: 'truck',
    photo_url: '',
    current_lat: -23.550520,
    current_lng: -46.633308
  });

  const queryClient = useQueryClient();

  // CORREÇÃO 1: Usando .findMany()
  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.findMany(),
  });

  // CORREÇÃO 2: Usando .findMany()
  const { data: vehicleTypes = [] } = useQuery({
    queryKey: ['vehicleTypes'],
    queryFn: () => base44.entities.VehicleType.findMany(),
  });

  // CORREÇÃO 3: Usando .findMany() e protegendo o filtro
  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const users = await base44.entities.AppUser.findMany();
      // Garante que users é um array antes de filtrar
      if (Array.isArray(users)) {
          return users.filter(u => u.app_role === 'driver' || u.app_role === 'motorista');
      }
      return [];
    }
  });

  const [newTypeName, setNewTypeName] = useState("");
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);

  const createTypeMutation = useMutation({
    mutationFn: (name) => base44.entities.VehicleType.create({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries(['vehicleTypes']);
      setNewTypeName("");
      toast.success("Novo tipo adicionado!");
    },
    onError: () => toast.error("Erro ao criar tipo")
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Vehicle.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['vehicles']);
      setIsDialogOpen(false);
      toast.success("Veículo cadastrado com sucesso!");
      setNewVehicle({
        plate: '', model: '', driver_name: '', status: 'available', 
        capacity_kg: 0, vehicle_type: 'truck', photo_url: '',
        current_lat: -23.550520, current_lng: -46.633308
      });
    },
    onError: () => toast.error("Erro ao cadastrar veículo")
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Vehicle.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['vehicles']);
      setEditingVehicle(null);
      toast.success("Veículo atualizado com sucesso!");
    },
    onError: () => toast.error("Erro ao atualizar veículo")
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setNewVehicle({ ...newVehicle, photo_url: file_url });
      toast.success("Foto carregada!");
    } catch (error) {
      toast.error("Erro no upload da imagem");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Gestão de Frota</h2>
          <p className="text-slate-500">Gerencie seus veículos e motoristas</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isTypeDialogOpen} onOpenChange={setIsTypeDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-slate-300 text-slate-600">
                Gerenciar Tipos
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] bg-white dark:bg-slate-900">
              <DialogHeader>
                <DialogTitle>Tipos de Veículo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Novo tipo (ex: Caminhão Baú)" 
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                  />
                  <Button onClick={() => newTypeName && createTypeMutation.mutate(newTypeName)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500 uppercase">Tipos Cadastrados</Label>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(vehicleTypes) && vehicleTypes.map(t => (
                      <div key={t.id} className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-sm text-slate-700 dark:text-slate-300">
                        {t.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20">
                <Plus className="w-4 h-4 mr-2" /> Novo Veículo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <DialogHeader>
                <DialogTitle>Cadastrar Veículo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Placa</Label>
                    <Input 
                      value={newVehicle.plate} 
                      onChange={e => setNewVehicle({...newVehicle, plate: e.target.value})}
                      placeholder="ABC-1234" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Modelo</Label>
                    <Input 
                      value={newVehicle.model} 
                      onChange={e => setNewVehicle({...newVehicle, model: e.target.value})}
                      placeholder="Scania R450" 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Motorista</Label>
                  <Select 
                    value={newVehicle.driver_name} 
                    onValueChange={val => setNewVehicle({...newVehicle, driver_name: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o motorista" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Nenhum</SelectItem>
                      {Array.isArray(drivers) && drivers.map(d => (
                        <SelectItem key={d.id} value={d.full_name}>{d.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select 
                      value={newVehicle.vehicle_type} 
                      onValueChange={val => setNewVehicle({...newVehicle, vehicle_type: val})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(vehicleTypes) && vehicleTypes.map(type => (
                          <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Capacidade (kg)</Label>
                    <Input 
                      type="number"
                      value={newVehicle.capacity_kg} 
                      onChange={e => setNewVehicle({...newVehicle, capacity_kg: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Foto do Veículo</Label>
                  <div className="flex items-center gap-4">
                    {newVehicle.photo_url ? (
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200">
                        <img src={newVehicle.photo_url} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          onClick={() => setNewVehicle({...newVehicle, photo_url: ''})}
                          className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full">
                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 dark:border-slate-700 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-6 h-6 text-slate-400 mb-2" />
                            <p className="text-xs text-slate-500">Clique para upload</p>
                          </div>
                          <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4"
                  onClick={() => createMutation.mutate(newVehicle)}
                  disabled={createMutation.isPending || uploading}
                >
                  {createMutation.isPending ? 'Salvando...' : 'Cadastrar Veículo'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingVehicle} onOpenChange={(open) => !open && setEditingVehicle(null)}>
        <DialogContent className="sm:max-w-[600px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle>Editar Veículo</DialogTitle>
          </DialogHeader>
          {editingVehicle && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Placa</Label>
                  <Input 
                    value={editingVehicle.plate} 
                    onChange={e => setEditingVehicle({...editingVehicle, plate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Modelo</Label>
                  <Input 
                    value={editingVehicle.model} 
                    onChange={e => setEditingVehicle({...editingVehicle, model: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Motorista</Label>
                <Select 
                  value={editingVehicle.driver_name} 
                  onValueChange={val => setEditingVehicle({...editingVehicle, driver_name: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o motorista" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Nenhum</SelectItem>
                    {Array.isArray(drivers) && drivers.map(d => (
                      <SelectItem key={d.id} value={d.full_name}>{d.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select 
                    value={editingVehicle.vehicle_type} 
                    onValueChange={val => setEditingVehicle({...editingVehicle, vehicle_type: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(vehicleTypes) && vehicleTypes.map(type => (
                        <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Capacidade (kg)</Label>
                  <Input 
                    type="number"
                    value={editingVehicle.capacity_kg} 
                    onChange={e => setEditingVehicle({...editingVehicle, capacity_kg: parseFloat(e.target.value)})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                  <Label>Status</Label>
                  <Select 
                    value={editingVehicle.status} 
                    onValueChange={val => setEditingVehicle({...editingVehicle, status: val})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Disponível</SelectItem>
                      <SelectItem value="in_transit">Em Trânsito</SelectItem>
                      <SelectItem value="maintenance">Manutenção</SelectItem>
                      <SelectItem value="stopped">Parado</SelectItem>
                    </SelectContent>
                  </Select>
              </div>

              <div className="space-y-2">
                <Label>Foto do Veículo</Label>
                <div className="flex items-center gap-4">
                  {editingVehicle.photo_url ? (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden border border-slate-200">
                      <img src={editingVehicle.photo_url} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setEditingVehicle({...editingVehicle, photo_url: ''})}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 dark:border-slate-700 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-6 h-6 text-slate-400 mb-2" />
                        <p className="text-xs text-slate-500">Clique para alterar foto</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        setUploading(true);
                        try {
                          const { file_url } = await base44.integrations.Core.UploadFile({ file });
                          setEditingVehicle({ ...editingVehicle, photo_url: file_url });
                          toast.success("Foto atualizada!");
                        } catch {
                          toast.error("Erro no upload");
                        } finally {
                          setUploading(false);
                        }
                      }} />
                    </label>
                  )}
                </div>
              </div>

              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4"
                onClick={() => updateMutation.mutate({ id: editingVehicle.id, data: editingVehicle })}
                disabled={updateMutation.isPending || uploading}
              >
                {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && <div className="text-center col-span-full py-10 text-gray-500">Carregando veículos...</div>}
        
        {/* CORREÇÃO IMPORTANTE: Renderização segura do array */}
        {vehicles && Array.isArray(vehicles) && vehicles.map((vehicle) => (
          <Card key={vehicle.id} className="overflow-hidden bg-white hover:shadow-xl transition-all duration-300 border border-gray-100 rounded-xl group">
            <div className="h-[240px] relative overflow-hidden bg-gray-100">
              <div className="absolute top-4 right-4 z-20">
                 <span className={`text-white text-xs font-bold px-3 py-1 rounded-md uppercase tracking-wide
                    ${vehicle.status === 'available' ? 'bg-[#10b981]' : 
                      vehicle.status === 'in_transit' ? 'bg-blue-500' : 'bg-gray-500'}
                 `}>
                    {vehicle.status === 'available' ? 'disponível' : 
                     vehicle.status === 'in_transit' ? 'em trânsito' : vehicle.status}
                 </span>
              </div>
              
              <div className="absolute top-4 left-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button 
                  onClick={() => setEditingVehicle(vehicle)}
                  className="bg-white/90 hover:bg-white text-gray-700 p-2 rounded-lg shadow-sm border border-gray-200 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>

              {vehicle.photo_url ? (
                <img 
                  src={vehicle.photo_url} 
                  alt={vehicle.model} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                   <Truck className="w-16 h-16 text-gray-300" />
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
            </div>
            <CardContent className="p-5">
               <h3 className="text-lg font-bold text-gray-900 mb-1 uppercase">{vehicle.plate}</h3>
               <p className="text-gray-500 text-sm mb-4">{vehicle.model}</p>
               
               <div className="flex justify-between items-center py-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                     <Truck className="w-4 h-4 text-gray-400" />
                     <span>Motorista</span>
                  </div>
                  <span className="font-semibold text-gray-900 text-sm">{vehicle.driver_name || 'Não atribuído'}</span>
               </div>

               <div className="flex justify-between items-center py-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                     <Package className="w-4 h-4 text-gray-400" />
                     <span>Capacidade</span>
                  </div>
                  <span className="font-semibold text-gray-900 text-sm">{vehicle.capacity_kg} kg</span>
               </div>

               <div className="flex justify-between items-center py-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                     <Truck className="w-4 h-4 text-gray-400" />
                     <span>Tipo</span>
                  </div>
                  <span className="font-semibold text-gray-900 text-sm capitalize">{vehicle.vehicle_type}</span>
               </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}