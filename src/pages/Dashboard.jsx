import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Truck, Package, Warehouse, Clock, Activity, CheckCircle2, TrendingUp, MoreHorizontal, Box } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const CustomStatCard = ({ title, value, subtext, icon: Icon, color = "emerald" }) => (
  <Card className="border-none shadow-sm bg-white">
    <CardContent className="p-6 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-600'}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          <span className="text-xs text-gray-400">{subtext}</span>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function DashboardPage() {
  const { data: vehicles = [] } = useQuery({ queryKey: ['vehicles'], queryFn: () => base44.entities.Vehicle.list() });
  const { data: orders = [] } = useQuery({ queryKey: ['orders'], queryFn: () => base44.entities.Order.list() });
  const { data: warehouses = [] } = useQuery({ queryKey: ['warehouses'], queryFn: () => base44.entities.Warehouse.list() });

  // Data Calculations
  const activeOrders = orders.filter(o => o.status === 'in_transit').length;
  const completedOrders = orders.filter(o => o.status === 'delivered').length;
  const avgProgress = "84%";
  const totalMaterials = warehouses.reduce((acc, w) => acc + (w.capacity || 0), 0);

  const barData = [
    { name: 'Jan', value: 40 }, { name: 'Feb', value: 30 }, { name: 'Mar', value: 20 },
    { name: 'Apr', value: 35 }, { name: 'May', value: 25 }, { name: 'Jun', value: 38 },
  ];
  const pieData = [
    { name: 'Planejamento', value: 6, color: '#3b82f6' },
    { name: 'Concluído', value: 1, color: '#10b981' },
  ];
  const lineData = [
    { name: 'Jan', value: 10 }, { name: 'Feb', value: 25 }, { name: 'Mar', value: 35 },
    { name: 'Apr', value: 50 }, { name: 'May', value: 65 }, { name: 'Jun', value: 78 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <CustomStatCard title="Rotas do Dia" value={activeOrders + 12} subtext="Planejadas" icon={Truck} />
        <CustomStatCard title="Viagens por Motorista" value="3.5" subtext="Média diária" icon={TrendingUp} />
        <CustomStatCard title="Eficiência de Entrega" value="94%" subtext="No prazo" icon={CheckCircle2} />
        <CustomStatCard title="Entregas Totais" value={completedOrders + 158} subtext="Este mês" icon={Package} />
      </div>

      {/* Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[380px]">
        {/* Green Timer Card */}
        <Card className="lg:col-span-3 bg-[#00A86B] text-white border-none shadow-lg relative overflow-hidden flex flex-col">
          <CardContent className="p-6 flex flex-col h-full justify-between relative z-10">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Tempo decorrido</p>
              <h2 className="text-4xl font-bold mt-1 font-mono">14:42:18</h2>
              <p className="text-emerald-100 text-sm mt-1">Entregas pendentes: {activeOrders}</p>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center my-4">
               <div className="w-full h-1 bg-emerald-600/30 rounded-full mb-8 relative">
                  <div className="absolute top-1/2 left-1/3 w-3 h-3 bg-white rounded-full transform -translate-y-1/2 shadow-lg"></div>
               </div>
               <Truck className="w-16 h-16 text-emerald-200/20 absolute top-1/2 right-4 transform -translate-y-1/2" />
            </div>

            <div className="space-y-3">
              <div className="bg-emerald-800/30 rounded-lg p-3 text-center">
                 <p className="text-sm font-medium">Nenhuma entrega programada</p>
              </div>
              <Button className="w-full bg-white text-emerald-700 hover:bg-emerald-50 font-bold">
                Programação de Logística
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Center Hero Image */}
        <Card className="lg:col-span-6 border-none shadow-lg relative overflow-hidden group">
           <div className="absolute inset-0 bg-cover bg-center transform transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80")' }}></div>
           <div className="absolute inset-0 bg-black/40"></div>
           <CardContent className="relative z-10 h-full flex flex-col items-center justify-center text-white text-center p-8">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/30">
                <Box className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Logispro Sistema de Logistica</h2>
              <p className="text-slate-200 max-w-md mb-6 text-sm">Visualize e gerencie sua obra e estoque em tempo real com nossa tecnologia de ponta.</p>
              <div className="flex gap-3">
                <Button variant="secondary" className="bg-white text-slate-900 hover:bg-slate-100">Ver Projetos</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white border-none">Abrir Monitor 3D</Button>
              </div>
           </CardContent>
        </Card>

        {/* Right Status List */}
        <Card className="lg:col-span-3 border-none shadow-lg bg-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-900">Status Geral</h3>
              <MoreHorizontal className="text-gray-400 w-5 h-5 cursor-pointer" />
            </div>
            <div className="space-y-6">
              {[
                { name: 'Projeto Alpha', status: 'Planejamento', progress: 0, color: 'bg-blue-100 text-blue-600' },
                { name: 'Galpão B', status: 'Em Execução', progress: 14, color: 'bg-emerald-100 text-emerald-600' },
                { name: 'Expansão C', status: 'Pendente', progress: 0, color: 'bg-amber-100 text-amber-600' },
              ].map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-start gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${item.color}`}>
                       <Box className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                       <div className="flex justify-between">
                          <p className="font-semibold text-sm text-gray-900">{item.name}</p>
                          <span className="text-xs font-bold text-gray-500">{item.progress}%</span>
                       </div>
                       <p className="text-xs text-gray-500">{item.status}</p>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                     <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${item.progress}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
             <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-end">
                   <div>
                      <p className="text-xs text-gray-400">Progresso médio</p>
                      <div className="h-1 w-24 bg-gray-100 rounded-full mt-1 overflow-hidden">
                         <div className="h-full bg-slate-800 w-[14%]"></div>
                      </div>
                   </div>
                   <span className="text-lg font-bold text-gray-900">14%</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Total de 7 projetos ativos</p>
             </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <Card className="border-none shadow-lg bg-white">
          <CardContent className="p-6">
             <h3 className="text-sm text-gray-500 mb-4">Progresso por Projeto</h3>
             <div className="h-[200px]">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={barData}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                   <Tooltip cursor={{fill: '#f9fafb'}} />
                   <Bar dataKey="value" fill="#00A86B" radius={[4, 4, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </CardContent>
        </Card>

        {/* Donut Chart */}
        <Card className="border-none shadow-lg bg-white">
          <CardContent className="p-6">
             <h3 className="text-sm text-gray-500 mb-4">Status dos Projetos</h3>
             <div className="h-[200px] flex items-center justify-center">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={pieData}
                     innerRadius={60}
                     outerRadius={80}
                     paddingAngle={0}
                     dataKey="value"
                   >
                     {pieData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Pie>
                   <Tooltip />
                 </PieChart>
               </ResponsiveContainer>
             </div>
             <div className="flex justify-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Planejamento</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Concluído</div>
             </div>
          </CardContent>
        </Card>

        {/* Line Chart */}
        <Card className="border-none shadow-lg bg-white">
          <CardContent className="p-6">
             <h3 className="text-sm text-gray-500 mb-4">Evolução do Progresso</h3>
             <div className="h-[200px]">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={lineData}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                   <Tooltip />
                   <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
                 </LineChart>
               </ResponsiveContainer>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}