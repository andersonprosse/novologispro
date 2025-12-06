import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  LayoutDashboard, 
  Truck, 
  Warehouse, 
  Package, 
  Map as MapIcon, 
  Moon, 
  Sun, 
  Menu, 
  X,
  LogOut,
  User
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function Layout({ children, currentPageName }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  // Define a sidebar aberta em telas grandes por padrão
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024); 
  const location = useLocation();

  // 1. ESTADO DE USUÁRIO
  // Iniciamos como null para evitar caracteres invisíveis na inicialização de objetos
  const [userData, setUserData] = useState(null);
  
  // --- FUNÇÃO DE LOGOUT CORRIGIDA (Blindada contra erros) ---
  const handleLogout = () => {
    // Tenta chamar o logout do servidor, mas usa try/catch para garantir que
    // o código não quebre, mesmo que a função base44.auth.logout() não exista ou falhe.
    try {
        if (base44 && base44.auth && typeof base44.auth.logout === 'function') {
            base44.auth.logout(); 
        }
    } catch(e) {
        console.warn("Falha ao chamar base44.auth.logout(). Limpeza local garantida.", e);
    }
    
    // 1. Limpa o localStorage do cliente (o mais importante para o frontend)
    localStorage.removeItem('app_user_id');
    localStorage.removeItem('demo_role');
    localStorage.removeItem('demo_username');
    localStorage.removeItem('user_permissions');
    localStorage.removeItem('app_user_email');
    
    // 2. Redireciona para a raiz, forçando o recarregamento da aplicação
    window.location.href = '/'; 
  };
  
  // Initialize theme and handle resize
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    const handleResize = () => {
        setIsSidebarOpen(window.innerWidth > 1024);
    };

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // --- LER APENAS DO LOCAL STORAGE ---
  useEffect(() => {
    const demoRole = localStorage.getItem('demo_role');
    const demoUsername = localStorage.getItem('demo_username');
    const userPermissionsString = localStorage.getItem('user_permissions');
    const userEmail = localStorage.getItem('app_user_email') || ''; 

    if (demoRole) {
        let permissions = [];
        try {
            permissions = JSON.parse(userPermissionsString || '[]'); 
        } catch (e) {
            permissions = [];
        }

        // Objeto limpo (digitado manualmente para evitar caracteres ocultos)
        setUserData({
            app_role: demoRole || 'guest',
            full_name: demoUsername || 'Usuário',
            email: userEmail,
            initials: (demoUsername?.substring(0, 2) || 'US').toUpperCase(),
            allowed_pages: permissions
        });
    } else {
        setUserData(null);
    }
  }, [location.pathname]);
  // --- FIM DA LÓGICA DE USUÁRIO ---

  if (currentPageName === 'Home') {
    return <main className="min-h-screen bg-white">{children}</main>;
  }
  
  if (!userData) {
      return null;
  }

  const allMenuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: 'Dashboard', id: 'Dashboard' },
    { name: 'Galpões', icon: Warehouse, path: 'Warehouses', id: 'Warehouses' },
    { name: 'Veículos', icon: Truck, path: 'Vehicles', id: 'Vehicles' },
    { name: 'Pedidos', icon: Package, path: 'Orders', id: 'Orders' },
    { name: 'Entregador', icon: MapIcon, path: 'Driver', id: 'Driver' },
    { name: 'Admin', icon: User, path: 'AdminUsers', id: 'AdminUsers' }, 
  ];

  const menuItems = allMenuItems.filter(item => {
    const userPermissions = userData.allowed_pages || [];

    if (userData.app_role === 'admin') return true;

    return userPermissions.includes(item.id);
  });

  return (
    <div className="min-h-screen font-sans bg-gray-50 text-slate-900">
      {/* Sidebar - Dark Theme Fixed */}
      <aside 
        className={`fixed top-0 left-0 z-40 h-screen transition-transform duration-300 ease-in-out 
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          w-64 bg-[#0F172A] text-white shadow-xl`}
      >
        <div className="h-full flex flex-col">
          {/* Logo Area */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800">
            <div className="flex items-center gap-2 font-bold text-xl">
              <div className="bg-emerald-500 p-1 rounded">
                 <Truck className="w-5 h-5 text-white" />
              </div>
              <span>Logispro</span>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="ml-auto lg:hidden p-1 rounded-md hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = currentPageName === item.name;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.path)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium text-sm
                    ${isActive 
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20 border-l-4 border-emerald-300' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Footer */}
          <div className="p-4 border-t border-slate-800">
             <div className="flex items-center gap-3 px-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold uppercase">
                  {userData?.initials || 'US'}
                </div>
                <div className="overflow-hidden">
                   <p className="text-sm font-medium truncate">{userData?.full_name || 'Usuário'}</p>
                   <p className="text-xs text-slate-500 truncate">{userData?.email || ''}</p>
                </div>
             </div>
            <button 
              onClick={handleLogout} 
              className="flex items-center gap-2 w-full px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : ''}`}>
        {/* Top Bar */}
        <header className={`sticky top-0 z-30 h-16 px-6 flex items-center justify-between backdrop-blur-xl border-b
          ${isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100 hidden sm:block">
              {currentPageName === 'Home' ? 'Visão Geral' : 
               currentPageName === 'Warehouses' ? 'Gestão de Galpões' :
               currentPageName === 'Vehicles' ? 'Frota de Veículos' :
               currentPageName === 'Orders' ? 'Pedidos de Entrega' :
               currentPageName === 'Driver' ? 'Portal do Entregador' :
               currentPageName}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20 uppercase">
                 {userData?.initials || 'U'}
               </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}