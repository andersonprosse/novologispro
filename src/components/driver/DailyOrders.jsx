import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Package, Clock, CheckCircle2, Navigation } from 'lucide-react';
import { toast } from "sonner";

export default function DailyOrders({ orders = [], myVehicleType, myVehicleId, onAcceptOrder }) {
  // Filter orders: 
  // 1. Status is 'pending'
  // 2. allowed_vehicles is empty OR contains 'Geral' OR contains myVehicleType
  const availableOrders = orders.filter(order => {
    if (order.status !== 'pending') return false;
    
    const allowed = order.allowed_vehicles || [];
    // If no restriction or 'Geral' is present, or if my type is allowed
    if (!allowed.length || allowed.includes('Geral') || (myVehicleType && allowed.includes(myVehicleType))) {
      return true;
    }
    return false;
  });

  const queryClient = useQueryClient();

  const acceptOrderMutation = useMutation({
    mutationFn: async (orderId) => {
      return base44.entities.Order.update(orderId, { 
        status: 'assigned',
        vehicle_id: myVehicleId 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['orders']); // Refresh orders
      toast.success("Corrida aceita com sucesso!");
      if (onAcceptOrder) onAcceptOrder();
    },
    onError: () => toast.error("Erro ao aceitar corrida")
  });

  if (availableOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800">
        <Package className="w-12 h-12 mb-3 opacity-50" />
        <p>Nenhuma corrida disponível para seu veículo no momento.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {availableOrders.map(order => (
        <Card key={order.id} className="bg-slate-800 border-slate-700 text-slate-100 shadow-lg hover:border-slate-600 transition-all">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <Badge variant="outline" className="mb-2 text-xs border-slate-600 text-slate-400">
                  #{order.order_number}
                </Badge>
                <CardTitle className="text-base font-bold text-white">
                  {order.customer_name}
                </CardTitle>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                R$ 45,00
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-2 text-sm space-y-3">
            <div className="flex items-start gap-2 text-slate-300">
              <MapPin className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
              <span>{order.address}</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400 text-xs">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> ~25 min
              </span>
              <span className="flex items-center gap-1">
                <Navigation className="w-3 h-3" /> 5.2 km
              </span>
            </div>
            {order.allowed_vehicles && order.allowed_vehicles.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {order.allowed_vehicles.map(type => (
                  <Badge key={type} variant="secondary" className="text-[10px] px-1.5 h-5 bg-slate-700 text-slate-300">
                    {type}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-2">
            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              onClick={() => acceptOrderMutation.mutate(order.id)}
              disabled={acceptOrderMutation.isPending}
            >
              {acceptOrderMutation.isPending ? (
                "Aceitando..."
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Aceitar Corrida
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}