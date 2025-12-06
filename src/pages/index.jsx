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

// Mapeamento das páginas
const PAGES = {
    Dashboard, Vehicles, Warehouses, Orders, Driver, Home, AdminUsers
};

// Função para identificar qual página estamos (para iluminar o menu)
function _getCurrentPage(url) {
    if (url === '/' || url === '') return 'Home'; // <--- CORREÇÃO: Raiz é Home
    if (url.endsWith('/')) url = url.slice(0, -1);
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) urlLastPart = urlLastPart.split('?')[0];
    
    // Procura o nome da página (case insensitive)
    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || 'Dashboard';
}

// Componente que Protege as Rotas (Segurança)
const ProtectedRoute = ({ children }) => {
    const userId = localStorage.getItem('app_user_id');
    
    if (!userId) {
        // Se não tem usuário logado, manda pro Login
        return <Navigate to="/Home" replace />;
    }
    return children;
};

function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);

    // SE FOR A HOME (LOGIN): Renderiza sem o Layout (Tela Cheia)
    if (currentPage === 'Home') {
        return (
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/Home" element={<Home />} />
                {/* Qualquer outra rota desconhecida vai para Home */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        );
    }

    // SE FOR OUTRAS PÁGINAS: Renderiza com Layout (Menu Lateral) + Proteção
    return (
        <Layout currentPageName={currentPage}>
            <Routes>
                {/* Se tentar acessar a raiz logado, vai pro Dashboard */}
                <Route path="/" element={<Navigate to="/Dashboard" replace />} />
                
                <Route path="/Dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/Vehicles" element={<ProtectedRoute><Vehicles /></ProtectedRoute>} />
                <Route path="/Warehouses" element={<ProtectedRoute><Warehouses /></ProtectedRoute>} />
                <Route path="/Orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                <Route path="/Driver" element={<ProtectedRoute><Driver /></ProtectedRoute>} />
                <Route path="/AdminUsers" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
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