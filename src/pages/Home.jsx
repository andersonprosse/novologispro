import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
// Removido import createPageUrl pois vamos usar rota direta
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Truck, User, Lock } from 'lucide-react';
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom'; // <--- IMPORTANTE: Importar isto

export default function HomePage() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  
  // Hook de navegação do React Router (O segredo para não dar 404)
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);

    const performLogin = async () => {
      try {
        const { username, password } = credentials;

        // 1. Usuários Demo (Hardcoded)
        let demoRole = null;
        if (password === '1234') {
           if (username === 'admin') demoRole = 'admin';
           if (username === 'lider') demoRole = 'warehouse_leader';
           if (username === 'motorista') demoRole = 'driver';
        }

        if (demoRole) {
          localStorage.setItem('demo_role', demoRole);
          localStorage.setItem('demo_username', username);
          localStorage.setItem('app_user_id', 'demo-user');
          // Admin demo vê tudo
          localStorage.setItem('user_permissions', JSON.stringify(['Dashboard', 'Vehicles', 'Warehouses', 'Orders', 'Driver', 'AdminUsers']));
          
          toast.success(`Bem-vindo, ${username.toUpperCase()}!`);
          
          // --- CORREÇÃO AQUI ---
          // Em vez de window.location.href (que recarrega a página e dá erro 404),
          // usamos navigate para trocar de tela instantaneamente.
          navigate('/Dashboard'); 
          // ---------------------
          return;
        }

        // 2. Busca no Banco de Dados
        const users = await base44.entities.AppUser.findMany();
        const safeUsers = Array.isArray(users) ? users : [];
        const user = safeUsers.find(u => u.username === username && u.password === password);

        if (user) {
          localStorage.setItem('demo_role', user.app_role);
          localStorage.setItem('demo_username', user.username);
          localStorage.setItem('app_user_id', user.id);
          
          const permissions = user.allowed_pages || [];
          localStorage.setItem('user_permissions', JSON.stringify(permissions));

          toast.success(`Bem-vindo, ${user.full_name}!`);
          
          // --- CORREÇÃO AQUI TAMBÉM ---
          navigate('/Dashboard'); 
          // ----------------------------
        } else {
          toast.error("Usuário ou senha incorretos");
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Login error:", error);
        toast.error("Erro ao realizar login");
        setIsLoading(false);
      }
    };

    performLogin();
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row overflow-hidden bg-white">
      {/* Lado Esquerdo - Verde (Login Form) */}
      <div className="w-full lg:w-[45%] bg-emerald-600 relative flex flex-col justify-center items-center p-8 lg:p-12">
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 rounded-full border-[40px] border-white/10"></div>
        <div className="absolute bottom-[-5%] right-[-5%] w-96 h-96 rounded-full border-[60px] border-white/10"></div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md relative z-10 animate-in slide-in-from-left duration-700">
          <div className="text-center mb-8">
             <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4 text-emerald-600">
                <Truck className="w-8 h-8" />
             </div>
             <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">LOGISPRO</h1>
             <p className="text-emerald-600 font-bold text-sm uppercase tracking-wider">Soluções em Frota</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-gray-500 text-xs uppercase font-bold">Usuário</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input 
                  className="pl-10 border-gray-200 bg-gray-50 focus:bg-white transition-all h-12 rounded-xl" 
                  placeholder="Digite seu usuário" 
                  value={credentials.username}
                  onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
               <Label className="text-gray-500 text-xs uppercase font-bold">Senha</Label>
               <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input 
                  type="password"
                  className="pl-10 border-gray-200 bg-gray-50 focus:bg-white transition-all h-12 rounded-xl" 
                  placeholder="Digite sua senha" 
                  value={credentials.password}
                  onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Checkbox id="keep-connected" />
                <label htmlFor="keep-connected" className="text-gray-500 font-medium cursor-pointer">Manter conectado</label>
              </div>
              <a href="#" className="text-emerald-600 font-bold hover:underline">Recuperar Senha</a>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02]"
              disabled={isLoading}
            >
              {isLoading ? 'Acessando...' : 'ENTRAR'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
             <p className="text-gray-500 text-sm">Não tem conta?</p>
             <Dialog>
                <DialogTrigger asChild>
                  <button className="text-emerald-600 font-bold hover:underline mt-1">Cadastrar Usuário</button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Novo Cadastro</DialogTitle>
                  </DialogHeader>
                  <div className="py-4 text-center space-y-4">
                    <div className="bg-emerald-50 p-4 rounded-lg">
                       <p className="text-emerald-800">Para cadastrar um novo usuário, entre em contato com o administrador do sistema.</p>
                    </div>
                  </div>
                </DialogContent>
             </Dialog>
          </div>
        </div>
        
        <p className="text-emerald-100/80 mt-8 text-sm relative z-10">© 2024 Logispro Sistemas.</p>
      </div>

      <div className="hidden lg:block w-[55%] bg-gray-50 relative overflow-hidden">
         <div className="absolute top-0 bottom-0 left-0 w-32 bg-emerald-600 rounded-r-[100%] transform -translate-x-1/2 z-10"></div>
         <div className="h-full w-full flex items-center justify-center relative z-0">
            <img 
              src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
              alt="Gestão de Frota" 
              className="relative z-10 max-w-[90%] rounded-2xl shadow-2xl object-cover max-h-[80vh]"
            />
         </div>
      </div>
    </div>
  );
}