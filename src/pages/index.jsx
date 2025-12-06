import React from 'react';
import Layout from "./Layout.jsx";
import Dashboard from "./Dashboard";
import Vehicles from "./Vehicles";
import Warehouses from "./Warehouses";
import Orders from "./Orders";
import Driver from "./Driver";
import Home from "./Home";
import AdminUsers from "./AdminUsers";
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';

const PAGES = {
    Dashboard: Dashboard,
    Vehicles: Vehicles,
    Warehouses: Warehouses,
    Orders: Orders,
    Driver: Driver,
    Home: Home, 
    AdminUsers: AdminUsers,
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) url = url.slice(0, -1);
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) urlLastPart = urlLastPart.split('?')[0];
    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || 'Dashboard';
}

// === COMPONENTE DE PROTEÇÃO (A SEGURANÇA) ===
const ProtectedRoute = ({ children, pageName }) => {
    // 1. Verifica se está logado (Se tem ID salvo)
    const userId = localStorage.getItem('app_user_id');
    const userRole = localStorage.getItem('demo_role');
    
    // Se não tem usuário logado, manda pro Login imediatamente
    if (!userId) {
        return <Navigate to="/Home" replace />;
    }

    // 2. Verifica Permissões
    // Se for Admin, libera tudo
    if (userRole === 'admin') {
        return children;
    }

    // Pega a lista de páginas permitidas que salvamos no Login
    const savedPermissions = localStorage.getItem('user_permissions');
    const allowedPages = savedPermissions ? JSON.parse(savedPermissions) : [];

    // Dashboard é sempre liberado para quem está logado (página padrão)
    if (pageName === 'Dashboard') {
        return children;
    }

    // Se a página atual NÃO está na lista de permitidas, bloqueia
    if (allowedPages.length > 0 && !allowedPages.includes(pageName)) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-10 bg-slate-50">
                <div className="bg-white border border-red-200 rounded-xl p-8 max-w-md shadow-xl">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Acesso Negado</h2>
                    <p className="text-slate-500 mb-6">Seu usuário não tem permissão para acessar a tela <strong>{pageName}</strong>.</p>
                    <a href="/Dashboard" className="block w-full bg-slate-800 text-white px-4 py-3 rounded-lg hover:bg-slate-900 transition font-medium">
                        Voltar ao Dashboard
                    </a>
                </div>
            </div>
        );
    }

    return children;
};

// Componente que decide se mostra o Layout ou não
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    // Se a página for HOME (Login), retorna direto sem Layout
    if (currentPage === 'Home') {
        return (
            <Routes>
                 <Route path="/Home" element={<Home />} />
                 {/* Se tentar acessar a raiz e não tiver logado, manda pro Home */}
                 <Route path="/" element={<Navigate to="/Home" replace />} />
                 <Route path="*" element={<Navigate to="/Home" replace />} />
            </Routes>
        );
    }

    // Para todas as outras páginas, usa o Layout + Proteção
    return (
        <Layout currentPageName={currentPage}>
            <Routes>
                {/* Redirecionamento da raiz se já estiver logado */}
                <Route path="/" element={<Navigate to="/Dashboard" replace />} />

                <Route path="/Dashboard" element={
                    <ProtectedRoute pageName="Dashboard"><Dashboard /></ProtectedRoute>
                } />

                <Route path="/Vehicles" element={
                    <ProtectedRoute pageName="Vehicles"><Vehicles /></ProtectedRoute>
                } />

                <Route path="/Warehouses" element={
                    <ProtectedRoute pageName="Warehouses"><Warehouses /></ProtectedRoute>
                } />

                <Route path="/Orders" element={
                    <ProtectedRoute pageName="Orders"><Orders /></ProtectedRoute>
                } />

                <Route path="/Driver" element={
                    <ProtectedRoute pageName="Driver"><Driver /></ProtectedRoute>
                } />

                <Route path="/AdminUsers" element={
                    <ProtectedRoute pageName="AdminUsers"><AdminUsers /></ProtectedRoute>
                } />
                
                {/* Rota para 404 dentro do sistema logado */}
                <Route path="*" element={<Navigate to="/Dashboard" replace />} />
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}