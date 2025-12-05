import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Truck, User, Lock, ArrowRight } from 'lucide-react';
import { toast } from "sonner";

export default function HomePage() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Login Logic
    const performLogin = async () => {
      try {
        const { username, password } = credentials;

        // 1. Check for hardcoded demo users first (legacy support)
        let demoRole = null;
        if (password === '1234') {
           if (username === 'admin') demoRole = 'admin';
           if (username === 'lider') demoRole = 'warehouse_leader';
           if (username === 'motorista') demoRole = 'driver';
        }

        if (demoRole) {
          localStorage.setItem('demo_role', demoRole);
          localStorage.setItem('demo_username', username);
          toast.success(`Bem-vindo, ${username.toUpperCase()}!`);
          window.location.href = createPageUrl('Dashboard');
          return;
        }

        // 2. Check against AppUser entity
        // Note: In a real app, this should be a backend function for security.
        // Fetching all users to filter client-side is not secure but fits this prototype request.
        const users = await base44.entities.AppUser.list();
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
          // Store user info in localStorage to mimic a session for this simple app structure
          localStorage.setItem('demo_role', user.app_role);
          localStorage.setItem('demo_username', user.username);
          // We might want to store more info to display correct name in layout
          localStorage.setItem('app_user_id', user.id);

          toast.success(`Bem-vindo, ${user.full_name}!`);
          window.location.href = createPageUrl('Dashboard');
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
    <div className="min-h-screen w-full flex flex-col lg:flex-row overflow-hidden">
      
      {/* Left Side - Green Section (Login Form) */}
      <div className="w-full lg:w-[45%] bg-emerald-600 relative flex flex-col justify-center items-center p-8 lg:p-12">
        {/* Background Circles Decoration */}
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 rounded-full border-[40px] border-white/10"></div>
        <div className="absolute bottom-[-5%] right-[-5%] w-96 h-96 rounded-full border-[60px] border-white/10"></div>

        {/* Login Card */}
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
                       <p className="text-emerald-800">Para cadastrar um novo usuário, entre em contato com o administrador do sistema ou envie uma solicitação.</p>
                    </div>
                    <Button className="w-full bg-emerald-600">Enviar Solicitação</Button>
                  </div>
                </DialogContent>
             </Dialog>
          </div>
        </div>
        
        <p className="text-emerald-100/80 mt-8 text-sm relative z-10">© 2024 Logispro Sistemas. Todos os direitos reservados.</p>
      </div>

      {/* Right Side - Image/Visual Section */}
      <div className="hidden lg:block w-[55%] bg-gray-50 relative overflow-hidden">
         {/* Decorative Curve */}
         <div className="absolute top-0 bottom-0 left-0 w-32 bg-emerald-600 rounded-r-[100%] transform -translate-x-1/2 z-10"></div>
         
         {/* Content Container */}
         <div className="h-full w-full flex items-center justify-center relative z-0">
            {/* Background Element */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-100/50 rounded-full"></div>
            
            <img 
              src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
              alt="Gestão de Frota" 
              className="relative z-10 max-w-[90%] rounded-2xl shadow-2xl object-cover max-h-[80vh]"
            />
            
            {/* Floating Badge */}
            <div className="absolute bottom-12 right-12 bg-emerald-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 z-20 hover:bg-emerald-700 transition-colors cursor-pointer">
               <div className="bg-white p-1 rounded-full">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
               </div>
               <span className="font-bold text-sm">Central de Atendimento</span>
            </div>
         </div>
      </div>
    </div>
  );
}