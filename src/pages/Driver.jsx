import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation, MapPin, Truck, Clock, Sun, Moon, CheckCircle, Bell, List, X } from 'lucide-react';
import LogisticsMap from '@/components/logistics/LogisticsMap';
import DailyOrders from '@/components/driver/DailyOrders';
import { toast } from "sonner";

export default function DriverPage() {
  const [activeTab, setActiveTab] = useState('map'); // map, orders
  const [showOrdersList, setShowOrdersList] = useState(false);
  const [isDarkMap, setIsDarkMap] = useState(true);
  const [currentLocation, setCurrentLocation] = useState([-23.550520, -46.633308]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [routePoints, setRoutePoints] = useState([]);
  const [simulationIndex, setSimulationIndex] = useState(0);
  const [eta, setEta] = useState("15 min");
  const [distance, setDistance] = useState("5.2 km");
  
  // Fetch Current User
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      // Check local storage first (AppUser flow)
      const storedId = localStorage.getItem('app_user_id');
      if (storedId) {
          const users = await base44.entities.AppUser.list();
          const found = users.find(u => u.id === storedId);
          if (found) return found;
      }
      // Fallback to platform auth
      return base44.auth.me().catch(() => null);
    },
  });

  // Fetch All Vehicles to find mine
  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list(),
  });

  // Fetch All Orders for the pool
  const { data: allOrders = [] } = useQuery({
    queryKey: ['allOrders'],
    queryFn: () => base44.entities.Order.list(),
  });

  // Determine my vehicle
  const myVehicle = vehicles.find(v => v.driver_name === user?.full_name);
  const myVehicleType = myVehicle?.vehicle_type;

  // My Active/Assigned Orders
  const myOrders = allOrders.filter(o => {
    // Match by exact vehicle ID if we had it, or just by 'assigned' status + some other logic
    // For now, let's assume if status is 'assigned' or 'in_transit' it might be ours
    // But we don't have a driver_id on order in schema, only vehicle_id.
    // Let's fallback to showing all for now or filter by status
    return (o.status === 'assigned' || o.status === 'in_transit') && o.vehicle_id === myVehicle?.id;
  });

  // Mock active order for demo if no real one assigned
  // We prioritize 'in_transit' then 'assigned'
  const activeOrder = myOrders.find(o => o.status === 'in_transit') || myOrders.find(o => o.status === 'assigned') || {
    id: 'demo',
    customer_name: 'Nenhuma corrida ativa',
    address: 'Aguardando...',
    lat: currentLocation[0],
    lng: currentLocation[1],
    status: 'idle',
    order_number: '---'
  };

  // Fetch Route from OSRM
  const fetchRoute = async (start, end) => {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`
      );
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const coordinates = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]); // Flip to [lat, lng]
        setRoutePoints(coordinates);
        setDistance((data.routes[0].distance / 1000).toFixed(1) + " km");
        setEta(Math.round(data.routes[0].duration / 60) + " min");
        return coordinates;
      }
    } catch (error) {
      console.error("Error fetching route:", error);
      toast.error("Erro ao calcular rota");
    }
    return [];
  };

  // Simulation Effect
  useEffect(() => {
    let interval;
    if (isNavigating && routePoints.length > 0) {
      interval = setInterval(() => {
        setSimulationIndex(prev => {
          const next = prev + 1;
          if (next >= routePoints.length) {
            setIsNavigating(false);
            toast.success("Você chegou ao destino!");
            return prev;
          }
          setCurrentLocation(routePoints[next]);
          return next;
        });
      }, 1000); // Update every second (fast simulation)
    }
    return () => clearInterval(interval);
  }, [isNavigating, routePoints]);

  const handleStartRide = async () => {
    // Use lat/lng from order (real or fallback)
    const destLat = activeOrder.lat || activeOrder.dest_lat; // Handle potential legacy data
    const destLng = activeOrder.lng || activeOrder.dest_lng;
    
    if (!destLat || !destLng) {
      toast.error("Destino inválido");
      return;
    }

    const points = await fetchRoute(currentLocation, [destLat, destLng]);
    if (points.length > 0) {
      setIsNavigating(true);
      setSimulationIndex(0);
      toast.success("Iniciando rota...");
    }
  };

  return (
    <div className="h-[calc(100vh-100px)] relative flex flex-col bg-slate-950 overflow-hidden rounded-2xl border border-slate-800">
      
      {/* View Switcher */}
      <div className="absolute top-4 left-4 z-20 flex gap-2">
        <Button 
          variant={activeTab === 'map' ? 'default' : 'secondary'}
          className={`${activeTab === 'map' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'} shadow-lg border border-slate-700`}
          onClick={() => setActiveTab('map')}
        >
          <MapPin className="w-4 h-4 mr-2" /> Mapa
        </Button>
        <Button 
          variant={activeTab === 'orders' ? 'default' : 'secondary'}
          className={`${activeTab === 'orders' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'} shadow-lg border border-slate-700`}
          onClick={() => setActiveTab('orders')}
        >
          <List className="w-4 h-4 mr-2" /> Pedidos Disponíveis
        </Button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'orders' ? (
         <div className="absolute inset-0 z-10 bg-slate-900 p-6 pt-20 overflow-y-auto">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Pedidos do Dia</h2>
                  <p className="text-slate-400">
                    {myVehicle ? `Veículo: ${myVehicle.model} (${myVehicleType})` : 'Nenhum veículo vinculado'}
                  </p>
                </div>
              </div>
              <DailyOrders 
                orders={allOrders} 
                myVehicleType={myVehicleType}
                myVehicleId={myVehicle?.id}
                onAcceptOrder={() => setActiveTab('map')} // Switch to map on accept
              />
            </div>
         </div>
      ) : (
        <>
      {/* Map Layer */}
      <div className="absolute inset-0 z-0">
        <LogisticsMap 
          center={currentLocation}
          zoom={15}
          vehicles={[{
            id: 'me', 
            current_lat: currentLocation[0], 
            current_lng: currentLocation[1], 
            status: 'in_transit',
            model: 'Meu Veículo',
            plate: 'ABC-1234',
            driver_name: 'Você'
          }]}
          orders={[activeOrder]}
          showRoute={true}
          routePoints={routePoints}
          height="100%"
          darkMode={isDarkMap}
        />
      </div>

      {/* Top Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <div className="relative">
          <Button 
            size="icon" 
            variant="secondary" 
            className="rounded-full shadow-lg bg-slate-800 text-white border border-slate-700 hover:bg-slate-700"
          >
            <Bell className="w-5 h-5" />
          </Button>
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900"></span>
        </div>
        <Button 
          size="icon" 
          variant="secondary" 
          className="rounded-full shadow-lg bg-slate-800 text-white border border-slate-700 hover:bg-slate-700"
          onClick={() => setShowOrdersList(!showOrdersList)}
        >
          <List className="w-5 h-5" />
        </Button>
        <Button 
          size="icon" 
          variant="secondary" 
          className="rounded-full shadow-lg bg-slate-800 text-white border border-slate-700 hover:bg-slate-700"
          onClick={() => setIsDarkMap(!isDarkMap)}
        >
          {isDarkMap ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
      </div>

      {/* Orders List Drawer */}
      {showOrdersList && (
        <div className="absolute inset-0 z-20 bg-slate-900/95 backdrop-blur-md p-6 animate-in slide-in-from-right duration-300">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Truck className="w-6 h-6 text-blue-500" /> Minhas Corridas
            </h2>
            <Button size="icon" variant="ghost" className="text-slate-400 hover:text-white" onClick={() => setShowOrdersList(false)}>
              <X className="w-6 h-6" />
            </Button>
          </div>
          
          <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
            {myOrders.map(order => (
              <div key={order.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xs font-mono text-slate-500">{order.order_number}</span>
                    <h3 className="font-bold text-slate-200">{order.customer_name}</h3>
                  </div>
                  <Badge className={`
                    ${order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 
                      order.status === 'delivered' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}
                  `}>
                    {order.status}
                  </Badge>
                </div>
                <p className="text-sm text-slate-400 flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4" /> {order.address}
                </p>
                <div className="flex justify-between items-center pt-3 border-t border-slate-700/50">
                  <span className="text-xs text-slate-500">Lote: {order.batch_number || '-'}</span>
                  <Button size="sm" variant="outline" className="h-8 text-xs border-slate-600 text-slate-300">
                    Detalhes
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Card (Waze Style) */}
      {activeOrder.status !== 'idle' && (
      <div className="mt-auto z-10 p-4">
        <Card className="bg-slate-900/90 backdrop-blur-md border-slate-700 text-white shadow-2xl">
          <CardContent className="p-5">
            {!isNavigating ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center animate-pulse">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Próxima Entrega</h3>
                    <p className="text-slate-400 text-sm">{activeOrder.customer_name}</p>
                  </div>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                  <p className="text-sm text-slate-300 flex items-start gap-2">
                    <Navigation className="w-4 h-4 mt-0.5 text-blue-400" />
                    {activeOrder.address}
                  </p>
                </div>
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-lg h-12 shadow-lg shadow-green-900/20"
                  onClick={handleStartRide}
                >
                  <Navigation className="w-5 h-5 mr-2" /> Iniciar Corrida
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-700 pb-4">
                  <div>
                    <p className="text-slate-400 text-xs uppercase font-bold">Tempo Restante</p>
                    <h2 className="text-3xl font-bold text-green-400">{eta}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-xs uppercase font-bold">Distância</p>
                    <h2 className="text-3xl font-bold">{distance}</h2>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
                  <span>Seguindo rota otimizada (trânsito leve)</span>
                </div>

                <div className="flex gap-3">
                   <Button 
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => {
                      setIsNavigating(false);
                      setRoutePoints([]);
                      toast.info("Rota cancelada");
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      setIsNavigating(false);
                      toast.success("Entrega marcada como realizada!");
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> Finalizar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      )}
      </>
      )}
    </div>
  );
}