
import React, { useState, useEffect, useMemo } from 'react';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  // Initialize theme from local storage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
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

  // Fetch user role/permissions
  const [userData, setUserData] = useState(null);
  
  useEffect(() => {
    // Check for demo/local storage login FIRST
    const demoRole = localStorage.getItem('demo_role');
    const appUserId = localStorage.getItem('app_user_id');
    
    const loadUser = async () => {
      if (appUserId) {
        // Load from AppUser entity if we have an ID
        try {
           const users = await base44.entities.AppUser.list({ id: appUserId }); // or just list and find
           // Since list with filter object might return array, or we can just use list() and find.
           // The SDK doc says list(query). Let's assume simple list() and find for reliability if ID filter isn't perfect in mock.
           const allUsers = await base44.entities.AppUser.list();
           const user = allUsers.find(u => u.id === appUserId);
           if (user) {
             setUserData({
               ...user,
               initials: user.full_name.substring(0, 2).toUpperCase()
             });
             return;
           }
        } catch (e) { console.error(e); }
      }

      // Fallback to legacy demo roles if no AppUser found
      if (demoRole) {
        let mockUser = { app_role: demoRole };
        if (demoRole === 'admin') {
          mockUser = { ...mockUser, full_name: 'Admin', email: 'admin@logispro.com', initials: 'AD' };
        } else if (demoRole === 'warehouse_leader') {
          mockUser = { ...mockUser, full_name: 'Lider', email: 'lider@logispro.com', initials: 'LI' };
        } else if (demoRole === 'driver') {
          mockUser = { ...mockUser, full_name: 'Motorista', email: 'motorista@logispro.com', initials: 'MO' };
        }
        setUserData(mockUser);
        return;
      }
    };

    loadUser();

    // Check for real auth
    base44.auth.me()
      .then(setUserData)
      .catch(() => {
        // No user logged in
      });
  }, []);

  if (currentPageName === 'Home') {
    return <main className="min-h-screen bg-white">{children}</main>;
  }

  const allMenuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: 'Dashboard', id: 'Dashboard' },
    { name: 'Galpões', icon: Warehouse, path: 'Warehouses', id: 'Warehouses' },
    { name: 'Veículos', icon: Truck, path: 'Vehicles', id: 'Vehicles' },
    { name: 'Pedidos', icon: Package, path: 'Orders', id: 'Orders' },
    { name: 'Entregador', icon: MapIcon, path: 'Driver', id: 'Driver' },
    { name: 'Admin', icon: User, path: 'AdminUsers', id: 'AdminUsers', role: 'admin' }, // Only visible to admin by default or explicit permission
  ];

  const menuItems = allMenuItems.filter(item => {
    if (!userData) return true; // Show all if loading (or handle loading state)
    
    // Admin gets everything
    if (userData.app_role === 'admin') return true;

    // Check explicit permissions
    if (userData.allowed_pages && userData.allowed_pages.length > 0) {
      return userData.allowed_pages.includes(item.id);
    }

    // Fallback Roles
    if (userData.app_role === 'driver') return item.id === 'Driver';
    if (userData.app_role === 'warehouse_leader') return ['Dashboard', 'Warehouses', 'Orders'].includes(item.id);
    
    // Hide Admin menu for non-admins
    if (item.role === 'admin' && userData.app_role !== 'admin') return false;

    return true;
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
                  {userData?.initials || userData?.full_name?.substring(0, 2) || 'US'}
                </div>
                <div className="overflow-hidden">
                   <p className="text-sm font-medium truncate">{userData?.full_name || 'Usuário'}</p>
                   <p className="text-xs text-slate-500 truncate">{userData?.email || ''}</p>
                </div>
             </div>
            <button 
              onClick={() => base44.auth.logout()}
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
                 {userData?.initials || userData?.full_name?.substring(0, 1) || 'U'}
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
