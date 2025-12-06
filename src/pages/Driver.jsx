import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch"; // Importando Switch
import { Label } from "@/components/ui/label";
import { Navigation, MapPin, Truck, Sun, Moon, CheckCircle, Bell, List, X, LocateFixed } from 'lucide-react';
import LogisticsMap from '@/components/logistics/LogisticsMap';
import DailyOrders from '@/components/driver/DailyOrders';
import { toast } from "sonner";

// Função utilitária para JSON seguro
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

export default function DriverPage() {
  const [activeTab, setActiveTab] = useState('map');
  const [showOrdersList, setShowOrdersList] = useState(false);
  const [isDarkMap, setIsDarkMap] = useState(true);
  const [currentLocation, setCurrentLocation] = useState([-23.550520, -46.633308]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [routePoints, setRoutePoints] = useState([]);
  const [simulationIndex, setSimulationIndex] = useState(0);
  const [eta, setEta] = useState("Calculando...");
  const [distance, setDistance] = useState("...");
  
  // NOVA OPÇÃO: Controla se usa GPS Real ou Simulação
  const [useSimulation, setUseSimulation] = useState(false);
  const watchIdRef = useRef(null); // Referência para limpar o GPS

  const queryClient = useQueryClient();

  // 1. Busca Usuário
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const storedId = localStorage.getItem('app_user_id');
      if (storedId) {
          const users = await base44.entities.AppUser.findMany();
          const found = Array.isArray(users) ? users.find(u => u.id === storedId) : null;
          if (found) return found;
      }
      return base44.auth.me().catch(() => null);
    },
  });

  // 2. Busca Veículos
  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
       const data = await base44.entities.Vehicle.findMany();
       return Array.isArray(data) ? data : [];
    }
  });

  // 3. Busca Pedidos
  const { data: allOrders = [] } = useQuery({
    queryKey: ['allOrders'],
    queryFn: async () => {
       const data = await base44.entities.Order.findMany();
       return Array.isArray(data) ? data : [];
    }
  });

  // Identifica meu veículo
  const myVehicle = Array.isArray(vehicles) ? vehicles.find(v => v.driver_name === user?.full_name) : null;
  const myVehicleType = myVehicle?.vehicle_type;

  // --- MUTAÇÃO PARA ATUALIZAR POSIÇÃO NO BANCO EM TEMPO REAL ---
  const updateLocationMutation = useMutation({
    mutationFn: (coords) => {
        if (!myVehicle?.id) return Promise.resolve();
        return base44.entities.Vehicle.update(myVehicle.id, {
            current_lat: coords[0],
            current_lng: coords[1],
            // Opcional: Atualizar status se necessário
            // status: 'in_transit' 
        });
    },
    onError: (err) => console.error("Erro ao sincronizar GPS", err)
  });

  // Filtros de Pedidos
  const availableOrders = Array.isArray(allOrders) ? allOrders
    .filter(order => {
        if (order.status !== 'pending') return false;
        const allowed = safeParseJSON(order.allowed_vehicles);
        if (allowed.includes('Geral')) return true;
        if (myVehicleType && allowed.includes(myVehicleType)) return true;
        return false;
    })
    .map(order => ({
        ...order,
        allowed_vehicles: safeParseJSON(order.allowed_vehicles)
    })) 
    : [];

  const myOrders = Array.isArray(allOrders) ? allOrders
    .filter(o => {
        const isMine = myVehicle?.id && o.vehicle_id === myVehicle.id;
        return (o.status === 'assigned' || o.status === 'in_transit') && (isMine || !o.vehicle_id);
    })
    .map(order => ({
        ...order,
        allowed_vehicles: safeParseJSON(order.allowed_vehicles)
    }))
    : [];

  const activeOrder = myOrders.find(o => o.status === 'in_transit') || myOrders.find(o => o.status === 'assigned') || {
    id: 'demo',
    customer_name: 'Nenhuma corrida ativa',
    address: 'Aguardando...',
    lat: currentLocation[0],
    lng: currentLocation[1],
    status: 'idle',
    order_number: '---'
  };

  // --- Lógica de Rota ---
  const fetchRoute = async (start, end) => {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`
      );
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const coordinates = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
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

  // --- EFEITO DE NAVEGAÇÃO (GPS REAL ou SIMULAÇÃO) ---
  useEffect(() => {
    let interval;

    // Se a navegação parou, limpamos tudo
    if (!isNavigating) {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        return;
    }

    // MODO SIMULAÇÃO
    if (useSimulation && routePoints.length > 0) {
      interval = setInterval(() => {
        setSimulationIndex(prev => {
          const next = prev + 1;
          if (next >= routePoints.length) {
            setIsNavigating(false);
            toast.success("Você chegou ao destino (Simulado)!");
            return prev;
          }
          const newPos = routePoints[next];
          setCurrentLocation(newPos);
          // Atualiza no banco também durante a simulação para ver no painel
          updateLocationMutation.mutate(newPos);
          return next;
        });
      }, 1000);
      return () => clearInterval(interval);
    } 
    
    // MODO GPS REAL
    else if (!useSimulation) {
        if (!("geolocation" in navigator)) {
            toast.error("Geolocalização não suportada neste navegador.");
            return;
        }

        // watchPosition: Dispara sempre que o dispositivo se move
        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const newPos = [latitude, longitude];
                
                console.log("GPS Atualizado:", newPos);
                setCurrentLocation(newPos);
                
                // Salva no banco de dados para o Gestor ver
                updateLocationMutation.mutate(newPos);
            },
            (error) => {
                console.error("Erro de GPS:", error);
                // Não mostramos toast de erro repetitivo para não travar a tela
            },
            {
                enableHighAccuracy: true, // Usa GPS de alta precisão
                timeout: 10000,
                maximumAge: 0
            }
        );

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }
  }, [isNavigating, routePoints, useSimulation]); // Recria o efeito se mudar o modo

  const handleStartRide = async () => {
    // Tenta pegar a localização atual real antes de traçar a rota
    if (!useSimulation && "geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (pos) => setCurrentLocation([pos.coords.latitude, pos.coords.longitude]),
            (err) => console.warn("Usando localização padrão inicial")
        );
    }

    const destLat = activeOrder.lat || activeOrder.dest_lat;
    const destLng = activeOrder.lng || activeOrder.dest_lng;
    
    if (!destLat || !destLng) {
      toast.error("Destino inválido");
      return;
    }

    const points = await fetchRoute(currentLocation, [destLat, destLng]);
    if (points.length > 0) {
      setIsNavigating(true);
      setSimulationIndex(0);
      toast.success(useSimulation ? "Iniciando Simulação..." : "Navegação GPS Iniciada!");
    }
  };

  return (
    <div className="h-[calc(100vh-100px)] relative flex flex-col bg-slate-950 overflow-hidden rounded-2xl border border-slate-800">
      
      {/* Botões Superiores */}
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
          <List className="w-4 h-4 mr-2" /> Pedidos ({availableOrders.length})
        </Button>
      </div>

      {/* ÁREA DE CONTEÚDO */}
      {activeTab === 'orders' ? (
         <div className="absolute inset-0 z-10 bg-slate-900 p-6 pt-20 overflow-y-auto">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Pedidos Disponíveis</h2>
                  <p className="text-slate-400">
                    {myVehicle ? `Exibindo cargas para: ${myVehicle.model} (${myVehicleType})` : 'Você não tem veículo vinculado.'}
                  </p>
                </div>
              </div>
              <DailyOrders 
                orders={availableOrders} 
                myVehicleType={myVehicleType}
                myVehicleId={myVehicle?.id}
                onAcceptOrder={() => setActiveTab('map')} 
              />
            </div>
         </div>
      ) : (
        <>
          {/* Mapa */}
          <div className="absolute inset-0 z-0">
            <LogisticsMap 
              center={currentLocation}
              zoom={16} // Zoom mais próximo para navegação
              vehicles={[{
                id: 'me', 
                current_lat: currentLocation[0], 
                current_lng: currentLocation[1], 
                status: 'in_transit',
                model: myVehicle?.model || 'Meu Veículo',
                plate: myVehicle?.plate || '---',
                driver_name: 'Você'
              }]}
              orders={[activeOrder]}
              showRoute={true}
              routePoints={routePoints}
              height="100%"
              darkMode={isDarkMap}
            />
          </div>

          {/* Controles do Mapa */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
            <div className="relative">
              <Button 
                size="icon" 
                variant="secondary" 
                className="rounded-full shadow-lg bg-slate-800 text-white border border-slate-700 hover:bg-slate-700"
              >
                <Bell className="w-5 h-5" />
              </Button>
              {availableOrders.length > 0 && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
              )}
            </div>
            {/* Botão para centralizar no GPS */}
            <Button 
                size="icon" 
                variant="secondary" 
                className="rounded-full shadow-lg bg-slate-800 text-blue-400 border border-slate-700 hover:bg-slate-700"
                onClick={() => {
                   if("geolocation" in navigator) {
                      navigator.geolocation.getCurrentPosition(p => {
                          setCurrentLocation([p.coords.latitude, p.coords.longitude]);
                          toast.success("Localização atualizada");
                      });
                   }
                }}
            >
              <LocateFixed className="w-5 h-5" />
            </Button>
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

          {/* Drawer Lateral (Meus Pedidos Ativos) */}
          {showOrdersList && (
            <div className="absolute inset-0 z-20 bg-slate-900/95 backdrop-blur-md p-6 animate-in slide-in-from-right duration-300">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Truck className="w-6 h-6 text-blue-500" /> Minhas Corridas Ativas
                </h2>
                <Button size="icon" variant="ghost" className="text-slate-400 hover:text-white" onClick={() => setShowOrdersList(false)}>
                  <X className="w-6 h-6" />
                </Button>
              </div>
              
              <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
                {myOrders.length === 0 ? (
                    <p className="text-slate-500 text-center py-10">Você não tem corridas ativas no momento.</p>
                ) : (
                    myOrders.map(order => (
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
                    </div>
                    ))
                )}
              </div>
            </div>
          )}

          {/* Card Inferior (Painel de Corrida) */}
          {activeOrder.status !== 'idle' && (
            <div className="mt-auto z-10 p-4">
              <Card className="bg-slate-900/95 backdrop-blur-xl border-slate-700 text-white shadow-2xl">
                <CardContent className="p-5">
                  {!isNavigating ? (
                    <div className="space-y-4">
                      {/* Cabeçalho do Card */}
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center animate-pulse">
                          <MapPin className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">Próxima Entrega</h3>
                          <p className="text-slate-400 text-sm">{activeOrder.customer_name}</p>
                        </div>
                      </div>

                      {/* Endereço */}
                      <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                        <p className="text-sm text-slate-300 flex items-start gap-2">
                          <Navigation className="w-4 h-4 mt-0.5 text-blue-400" />
                          {activeOrder.address}
                        </p>
                      </div>

                      {/* Opção de Simulação */}
                      <div className="flex items-center space-x-2 py-2">
                        <Switch 
                            id="simulation-mode" 
                            checked={useSimulation}
                            onCheckedChange={setUseSimulation}
                        />
                        <Label htmlFor="simulation-mode" className="text-sm text-slate-400">
                            {useSimulation ? "Modo: Simulação (Demo)" : "Modo: GPS Real"}
                        </Label>
                      </div>

                      {/* Botão Iniciar */}
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-lg h-12 shadow-lg shadow-green-900/20"
                        onClick={handleStartRide}
                      >
                        <Navigation className="w-5 h-5 mr-2" /> Iniciar Corrida
                      </Button>
                    </div>
                  ) : (
                    // MODO NAVEGAÇÃO ATIVA
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-700 pb-4">
                        <div>
                          <p className="text-slate-400 text-xs uppercase font-bold">Tempo (Est.)</p>
                          <h2 className="text-3xl font-bold text-green-400">{eta}</h2>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-400 text-xs uppercase font-bold">Distância</p>
                          <h2 className="text-3xl font-bold">{distance}</h2>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm text-slate-300">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
                        <span>
                            {useSimulation ? "Simulando trajeto..." : "Usando GPS do dispositivo"}
                        </span>
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